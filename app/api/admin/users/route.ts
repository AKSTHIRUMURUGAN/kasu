import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }
    
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        aadhar: user.aadhar,
        pan: user.pan,
        drivingLicense: user.drivingLicense,
        balance: user.balance,
        status: user.status,
        role: user.role,
        kasuDevice: user.kasuDevice,
        createdAt: user.createdAt
      }))
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}