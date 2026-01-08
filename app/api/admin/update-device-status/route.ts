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

    // Mark devices as offline if they haven't been seen in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const result = await User.updateMany(
      {
        'kasuDevice.lastSeen': { $lt: fiveMinutesAgo },
        'kasuDevice.connectionStatus': 'online'
      },
      {
        $set: {
          'kasuDevice.connectionStatus': 'offline'
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} devices to offline status`,
      updatedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('Device status update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}