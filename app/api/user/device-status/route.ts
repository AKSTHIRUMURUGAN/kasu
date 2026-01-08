import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice } from '@/lib/models'
import { verifyToken, createErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const authResult = verifyToken(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const userId = (authResult.user as any)?.userId
    if (!userId) {
      return createErrorResponse('Invalid user token', 401)
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    let deviceDetails = null
    if (user.kasuDevice?.macAddress) {
      const device = await KasuDevice.findOne({ macAddress: user.kasuDevice.macAddress })
      if (device) {
        deviceDetails = {
          macAddress: device.macAddress,
          status: device.status,
          lastSync: device.lastSync,
          localBalance: device.localBalance,
          deviceInfo: device.deviceInfo,
          connectionStatus: user.kasuDevice.connectionStatus,
          lastSeen: user.kasuDevice.lastSeen,
          assignedAt: user.kasuDevice.assignedAt
        }
      }
    }

    return NextResponse.json({
      success: true,
      device: deviceDetails,
      userDeviceInfo: user.kasuDevice
    })

  } catch (error) {
    console.error('Device status fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}