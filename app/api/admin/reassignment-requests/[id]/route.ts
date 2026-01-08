import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice, DeviceReassignmentRequest } from '@/lib/models'
import { verifyToken, createErrorResponse } from '@/lib/auth'

// Approve or reject reassignment request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    // Await the params since they're now async in Next.js 15
    const { id } = await params
    
    // Verify admin token
    const authResult = verifyToken(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    // Check if user is admin
    const userPayload = authResult.user as any
    if (userPayload.role !== 'admin' && userPayload.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, adminNotes } = body // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Find the reassignment request
    const reassignmentRequest = await DeviceReassignmentRequest.findById(id)
      .populate('userId', 'name phone email kasuDevice')

    if (!reassignmentRequest) {
      return NextResponse.json(
        { success: false, message: 'Reassignment request not found' },
        { status: 404 }
      )
    }

    if (reassignmentRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Find admin user
    const adminUser = await User.findOne({ phone: userPayload.phone })
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Start transaction-like operations
      const user = reassignmentRequest.userId
      const requestedDevice = await KasuDevice.findOne({ 
        macAddress: reassignmentRequest.requestedDeviceMac 
      })

      if (!requestedDevice) {
        return NextResponse.json(
          { success: false, message: 'Requested device not found' },
          { status: 404 }
        )
      }

      // Check if requested device is still available or assigned to someone else
      if (requestedDevice.status === 'assigned' && requestedDevice.phone !== user.phone) {
        const currentOwner = await User.findOne({ phone: requestedDevice.phone })
        if (currentOwner && currentOwner._id.toString() !== user._id.toString()) {
          return NextResponse.json(
            { success: false, message: 'Requested device is now assigned to another user' },
            { status: 400 }
          )
        }
      }

      // Deactivate user's current device if they have one
      if (user.kasuDevice?.macAddress) {
        const currentDevice = await KasuDevice.findOne({ 
          macAddress: user.kasuDevice.macAddress 
        })
        
        if (currentDevice) {
          currentDevice.status = 'deactivated'
          currentDevice.phone = null
          currentDevice.deactivatedAt = new Date()
          currentDevice.deactivatedBy = adminUser._id
          await currentDevice.save()
        }

        // Clear user's current device assignment
        user.kasuDevice = {
          macAddress: null,
          assignedAt: null,
          status: 'unassigned',
          connectionStatus: 'unknown',
          lastSeen: null
        }
      }

      // Assign new device to user
      user.kasuDevice = {
        macAddress: requestedDevice.macAddress,
        assignedAt: new Date(),
        status: 'assigned',
        connectionStatus: 'unknown',
        lastSeen: null
      }

      // Update requested device
      requestedDevice.status = 'assigned'
      requestedDevice.phone = user.phone

      // Save changes
      await user.save()
      await requestedDevice.save()
    }

    // Update reassignment request
    reassignmentRequest.status = action === 'approve' ? 'approved' : 'rejected'
    reassignmentRequest.adminNotes = adminNotes || ''
    reassignmentRequest.processedBy = adminUser._id
    reassignmentRequest.processedAt = new Date()
    
    await reassignmentRequest.save()

    return NextResponse.json({
      success: true,
      message: `Reassignment request ${action}d successfully`,
      request: reassignmentRequest
    })

  } catch (error) {
    console.error('Process reassignment request error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}