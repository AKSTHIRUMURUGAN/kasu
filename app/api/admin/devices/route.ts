import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice } from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    // Get all devices from KasuDevice collection and match with users
    const devices = await KasuDevice.find({}).sort({ createdAt: -1 })
    
    // Get assigned users for each device
    const devicesWithUsers = await Promise.all(
      devices.map(async (device) => {
        const user = await User.findOne({ 'kasuDevice.macAddress': device.macAddress })
        return {
          _id: device._id,
          macAddress: device.macAddress,
          status: device.status,
          deviceInfo: device.deviceInfo,
          createdAt: device.createdAt,
          assignedUser: user ? {
            name: user.name,
            phone: user.phone
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      devices: devicesWithUsers
    })

  } catch (error) {
    console.error('Devices fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { macAddress, deviceInfo } = body

    if (!macAddress) {
      return NextResponse.json(
        { success: false, message: 'MAC address is required' },
        { status: 400 }
      )
    }

    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    if (!macRegex.test(macAddress)) {
      return NextResponse.json(
        { success: false, message: 'Invalid MAC address format' },
        { status: 400 }
      )
    }

    // Check if device already exists
    const existingDevice = await KasuDevice.findOne({ macAddress })
    if (existingDevice) {
      return NextResponse.json(
        { success: false, message: 'Device with this MAC address already exists' },
        { status: 400 }
      )
    }

    // Create new device
    const newDevice = new KasuDevice({
      macAddress: macAddress.toUpperCase(),
      status: 'unassigned',
      deviceInfo: {
        model: deviceInfo?.model || 'KASU Device',
        firmware: deviceInfo?.firmware || '1.0.0',
        batteryLevel: null
      }
    })

    await newDevice.save()

    return NextResponse.json({
      success: true,
      message: 'Device added successfully',
      device: {
        _id: newDevice._id,
        macAddress: newDevice.macAddress,
        status: newDevice.status,
        deviceInfo: newDevice.deviceInfo,
        createdAt: newDevice.createdAt
      }
    })

  } catch (error) {
    console.error('Device creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}