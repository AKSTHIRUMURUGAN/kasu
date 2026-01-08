import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { userId, macAddress } = body

    if (!userId || !macAddress) {
      return NextResponse.json(
        { success: false, message: 'User ID and MAC address are required' },
        { status: 400 }
      )
    }

    // Check if MAC address is already assigned
    const existingDevice = await User.findOne({ 'kasuDevice.macAddress': macAddress })
    if (existingDevice) {
      return NextResponse.json(
        { success: false, message: 'Device already assigned to another user' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (user.status !== 'verified') {
      return NextResponse.json(
        { success: false, message: 'User must be verified before device assignment' },
        { status: 400 }
      )
    }

    // Assign device with proper initial status
    user.kasuDevice = {
      macAddress,
      assignedAt: new Date(),
      status: 'assigned', // Device is assigned but not yet connected
      connectionStatus: 'unknown', // No connection established yet
      lastSeen: null // No heartbeat received yet
    }
    user.status = 'active'
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Device assigned successfully',
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        status: user.status,
        kasuDevice: user.kasuDevice
      }
    })

  } catch (error) {
    console.error('Device assignment error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}