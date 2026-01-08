import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice, DeviceReassignmentRequest } from '@/lib/models'
import { verifyToken, createErrorResponse } from '@/lib/auth'

// Get all reassignment requests (Admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
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

    // Get all reassignment requests with user details
    const requests = await DeviceReassignmentRequest.find()
      .populate('userId', 'name phone email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })

    // Enhance requests with device info
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toObject()
        
        // Get current device info
        if (requestObj.currentDeviceMac) {
          const currentDevice = await KasuDevice.findOne({ macAddress: requestObj.currentDeviceMac })
          requestObj.currentDevice = currentDevice
        }
        
        // Get requested device info
        const requestedDevice = await KasuDevice.findOne({ macAddress: requestObj.requestedDeviceMac })
        requestObj.requestedDevice = requestedDevice
        
        return requestObj
      })
    )

    return NextResponse.json({
      success: true,
      requests: enhancedRequests
    })

  } catch (error) {
    console.error('Get reassignment requests error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}