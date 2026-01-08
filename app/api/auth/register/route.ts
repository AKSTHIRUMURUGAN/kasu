import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { name, phone, email, password, aadhar, pan, drivingLicense } = body

    // Validation
    if (!name || !phone || !email || !password || !aadhar) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Phone number must be 10 digits' },
        { status: 400 }
      )
    }

    if (aadhar.length !== 12) {
      return NextResponse.json(
        { success: false, message: 'Aadhaar number must be 12 digits' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { phone },
        { email },
        { aadhar }
      ]
    })

    if (existingUser) {
      let message = 'User already exists'
      if (existingUser.phone === phone) message = 'Phone number already registered'
      if (existingUser.email === email) message = 'Email already registered'
      if (existingUser.aadhar === aadhar) message = 'Aadhaar number already registered'
      
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = new User({
      name,
      phone,
      email,
      password: hashedPassword,
      aadhar,
      pan: pan || undefined,
      drivingLicense: drivingLicense || undefined,
      status: 'pending',
      balance: 0
    })

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please wait for admin approval.',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        status: user.status
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}