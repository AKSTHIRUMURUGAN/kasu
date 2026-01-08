import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    await connectDB()
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // If user has no device assigned
    if (!user.kasuDevice || !user.kasuDevice.macAddress) {
      return NextResponse.json({
        success: true,
        device: null,
        userDeviceInfo: null,
        message: 'No device assigned'
      })
    }

    // Get real-time device status
    const { getDeviceStatus } = await import('@/lib/device-status-monitor')
    const deviceStatusResult = await getDeviceStatus(user.kasuDevice.macAddress, user.phone)
    
    if (!deviceStatusResult.success) {
      return NextResponse.json({
        success: true,
        device: {
          macAddress: user.kasuDevice.macAddress,
          connectionStatus: 'unknown',
          lastSeen: user.kasuDevice.lastSeen,
          status: user.kasuDevice.status
        },
        userDeviceInfo: user.kasuDevice,
        message: 'Device status unknown'
      })
    }

    // Calculate connection quality based on last seen time
    const now = new Date()
    const lastSeen = deviceStatusResult.device?.lastSeen
    const timeSinceLastSeen = lastSeen ? now.getTime() - new Date(lastSeen).getTime() : null
    
    let connectionQuality = 'unknown'
    if (deviceStatusResult.device?.isOnline) {
      if (timeSinceLastSeen && timeSinceLastSeen < 30000) { // Less than 30 seconds
        connectionQuality = 'excellent'
      } else if (timeSinceLastSeen && timeSinceLastSeen < 60000) { // Less than 1 minute
        connectionQuality = 'good'
      } else {
        connectionQuality = 'fair'
      }
    } else {
      connectionQuality = 'offline'
    }

    return NextResponse.json({
      success: true,
      device: {
        ...deviceStatusResult.device,
        connectionQuality,
        lastSeenFormatted: lastSeen ? new Date(lastSeen).toLocaleString() : null,
        timeSinceLastSeenMinutes: timeSinceLastSeen ? Math.floor(timeSinceLastSeen / (1000 * 60)) : null
      },
      userDeviceInfo: user.kasuDevice
    })

  } catch (error) {
    console.error('❌ User device status API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}