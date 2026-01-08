import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const macAddress = searchParams.get('macAddress')
    const phone = searchParams.get('phone')

    if (!macAddress && !phone) {
      return NextResponse.json(
        { success: false, message: 'MAC address or phone number is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // If both provided, get specific device status
    if (macAddress && phone) {
      const { getDeviceStatus } = await import('@/lib/device-status-monitor')
      const result = await getDeviceStatus(macAddress, phone)
      return NextResponse.json(result)
    }

    // If only phone provided, get user's device status
    if (phone) {
      const user = await User.findOne({ phone })
      if (!user || !user.kasuDevice) {
        return NextResponse.json({
          success: false,
          message: 'No device assigned to this phone number',
          status: 'unassigned'
        })
      }

      const { getDeviceStatus } = await import('@/lib/device-status-monitor')
      const result = await getDeviceStatus(user.kasuDevice.macAddress, phone)
      return NextResponse.json(result)
    }

    // If only MAC address provided, find the device
    if (macAddress) {
      const user = await User.findOne({ 'kasuDevice.macAddress': macAddress })
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'Device not assigned to any user',
          status: 'unassigned'
        })
      }

      const { getDeviceStatus } = await import('@/lib/device-status-monitor')
      const result = await getDeviceStatus(macAddress, user.phone)
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('❌ Device status API error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'monitor') {
      // Trigger manual device status check
      const { monitorDeviceStatus } = await import('@/lib/device-status-monitor')
      const result = await monitorDeviceStatus()
      
      return NextResponse.json({
        success: true,
        message: 'Device status monitoring completed',
        result
      })
    }

    if (action === 'list') {
      // Get all devices with their status
      await connectDB()
      
      const users = await User.find({ 
        'kasuDevice.macAddress': { $exists: true } 
      }).select('phone name kasuDevice')

      const devices = users.map(user => ({
        macAddress: user.kasuDevice.macAddress,
        phone: user.phone,
        name: user.name,
        connectionStatus: user.kasuDevice.connectionStatus,
        lastSeen: user.kasuDevice.lastSeen,
        status: user.kasuDevice.status
      }))

      return NextResponse.json({
        success: true,
        devices,
        total: devices.length,
        online: devices.filter(d => d.connectionStatus === 'online').length,
        offline: devices.filter(d => d.connectionStatus === 'offline').length
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Device status POST API error:', error)
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