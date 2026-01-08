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

    // Find users with assigned devices
    const usersWithDevices = await User.find({ 
      'kasuDevice.macAddress': { $exists: true, $ne: null } 
    })

    let updatedCount = 0

    for (const user of usersWithDevices) {
      if (user.kasuDevice) {
        // Only simulate status for devices that have been assigned (not unassigned)
        if (user.kasuDevice.status !== 'unassigned') {
          // Simulate realistic device status transitions
          const currentStatus = user.kasuDevice.connectionStatus
          let newStatus
          
          if (currentStatus === 'unknown') {
            // 70% chance device connects for first time
            newStatus = Math.random() < 0.7 ? 'online' : 'unknown'
          } else if (currentStatus === 'online') {
            // 80% chance stays online, 20% goes offline
            newStatus = Math.random() < 0.8 ? 'online' : 'offline'
          } else {
            // offline - 60% chance comes back online
            newStatus = Math.random() < 0.6 ? 'online' : 'offline'
          }
          
          user.kasuDevice.connectionStatus = newStatus
          
          if (newStatus === 'online') {
            user.kasuDevice.lastSeen = new Date()
            user.kasuDevice.status = 'active'
          } else if (newStatus === 'offline' && currentStatus === 'online') {
            // Just went offline, update last seen
            user.kasuDevice.lastSeen = new Date(Date.now() - Math.random() * 60 * 60 * 1000) // Random time in last hour
          }
          
          await user.save()
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} device statuses`,
      updatedCount
    })

  } catch (error) {
    console.error('Device simulation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}