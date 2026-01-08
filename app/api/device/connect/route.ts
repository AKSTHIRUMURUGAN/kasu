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
    const { macAddress, phone } = body

    if (!macAddress || !phone) {
      return NextResponse.json(
        { success: false, message: 'MAC address and phone are required' },
        { status: 400 }
      )
    }

    // Find the user by phone (since device connection uses phone from JWT)
    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is verified and active
    if (user.status !== 'active' && user.status !== 'verified') {
      return NextResponse.json(
        { success: false, message: 'User account must be verified before connecting device' },
        { status: 400 }
      )
    }

    // Check if device exists in KasuDevice collection
    const device = await KasuDevice.findOne({ macAddress })
    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Device not found. Please contact admin to register this device.' },
        { status: 404 }
      )
    }

    // Check if device is deactivated
    if (device.status === 'deactivated') {
      return NextResponse.json(
        { success: false, message: 'This device has been deactivated. Please contact admin.' },
        { status: 400 }
      )
    }

    // Check if device is already assigned to another user
    const existingAssignment = await User.findOne({ 
      'kasuDevice.macAddress': macAddress,
      phone: { $ne: phone }
    })
    
    if (existingAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Device is already assigned to another user. Please contact admin to reassign.',
          code: 'DEVICE_ALREADY_ASSIGNED',
          canRequestReassignment: true
        },
        { status: 400 }
      )
    }

    // Check if user already has a device assigned
    if (user.kasuDevice?.macAddress && user.kasuDevice.macAddress !== macAddress) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You already have a device assigned. Please contact admin to reassign.',
          code: 'USER_HAS_DEVICE',
          currentDevice: user.kasuDevice.macAddress,
          canRequestReassignment: true
        },
        { status: 400 }
      )
    }

    // Check if there's an approved reassignment request for this user and device
    const approvedRequest = await DeviceReassignmentRequest.findOne({
      userId: user._id,
      requestedDeviceMac: macAddress,
      status: 'approved'
    })

    // If user already has this device assigned or there's an approved request, proceed with assignment
    if (user.kasuDevice?.macAddress === macAddress || approvedRequest) {
      // Assign device to user
      user.kasuDevice = {
        macAddress,
        assignedAt: new Date(),
        status: 'assigned',
        connectionStatus: 'unknown',
        lastSeen: null
      }
      
      // Update user status to active if verified
      if (user.status === 'verified') {
        user.status = 'active'
      }

      await user.save()

      // Update device status
      device.status = 'assigned'
      device.phone = phone
      await device.save()

      return NextResponse.json({
        success: true,
        message: 'Device connected successfully',
        device: {
          macAddress: device.macAddress,
          status: device.status,
          assignedAt: user.kasuDevice.assignedAt
        }
      })
    }

    // If we reach here, it means the device is unassigned and user doesn't have a device
    // Proceed with normal assignment
    user.kasuDevice = {
      macAddress,
      assignedAt: new Date(),
      status: 'assigned',
      connectionStatus: 'unknown',
      lastSeen: null
    }
    
    // Update user status to active if verified
    if (user.status === 'verified') {
      user.status = 'active'
    }

    await user.save()

    // Update device status
    device.status = 'assigned'
    device.phone = phone
    await device.save()

    return NextResponse.json({
      success: true,
      message: 'Device connected successfully',
      device: {
        macAddress: device.macAddress,
        status: device.status,
        assignedAt: user.kasuDevice.assignedAt
      }
    })

  } catch (error) {
    console.error('Device connection error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}