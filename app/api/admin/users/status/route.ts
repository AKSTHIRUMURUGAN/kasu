import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { userId, status } = body

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, message: 'User ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'verified', 'active', 'blocked']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
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

    user.status = status
    await user.save()

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        status: user.status
      }
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}