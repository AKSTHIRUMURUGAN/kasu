import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice, DeviceReassignmentRequest } from '@/lib/models'
import { verifyToken, createErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const authResult = verifyToken(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { macAddress, reason } = body

    if (!macAddress || !reason) {
      return NextResponse.json(
        { success: false, message: 'MAC address and reason are required' },
        { status: 400 }
      )
    }

    // Find the user by phone from JWT
    const userPayload = authResult.user as any
    const user = await User.findOne({ phone: userPayload.phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if device exists
    const device = await KasuDevice.findOne({ macAddress })
    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      )
    }

    // Check if device is already assigned to this user
    if (user.kasuDevice?.macAddress === macAddress) {
      return NextResponse.json(
        { success: false, message: 'This device is already assigned to you' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request for this user and device
    const existingRequest = await DeviceReassignmentRequest.findOne({
      userId: user._id,
      requestedDeviceMac: macAddress,
      status: 'pending'
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: 'You already have a pending request for this device' },
        { status: 400 }
      )
    }

    // Create reassignment request
    const reassignmentRequest = new DeviceReassignmentRequest({
      userId: user._id,
      phone: user.phone,
      currentDeviceMac: user.kasuDevice?.macAddress || null,
      requestedDeviceMac: macAddress,
      reason: reason,
      status: 'pending'
    })

    await reassignmentRequest.save()

    return NextResponse.json({
      success: true,
      message: 'Device reassignment request submitted successfully. Admin will review your request.',
      requestId: reassignmentRequest._id
    })

  } catch (error) {
    console.error('Device reassignment request error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's reassignment requests
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const authResult = verifyToken(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    // Find the user by phone from JWT
    const userPayload = authResult.user as any
    const user = await User.findOne({ phone: userPayload.phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's reassignment requests
    const requests = await DeviceReassignmentRequest.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate('processedBy', 'name')

    return NextResponse.json({
      success: true,
      requests: requests
    })

  } catch (error) {
    console.error('Get reassignment requests error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}