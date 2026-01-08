import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { identifier, password } = body // Changed from phone to identifier

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Phone/Email and password are required' },
        { status: 400 }
      )
    }

    // Determine if identifier is phone or email
    const isEmail = identifier.includes('@')
    const isPhone = /^\d{10}$/.test(identifier)

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid phone number (10 digits) or email address' },
        { status: 400 }
      )
    }

    // Find user by phone or email
    let user
    if (isEmail) {
      user = await User.findOne({ email: identifier })
    } else {
      user = await User.findOne({ phone: identifier })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is approved
    if (user.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Your account has been blocked. Please contact support.' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        phone: user.phone,
        email: user.email,
        status: user.status,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        balance: user.balance,
        status: user.status,
        role: user.role,
        kasuDevice: user.kasuDevice
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}