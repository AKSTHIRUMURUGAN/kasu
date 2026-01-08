import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Phone number or email is required' },
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

    await connectDB()

    // Find user by phone or email
    let user
    if (isEmail) {
      user = await User.findOne({ email: identifier })
    } else {
      user = await User.findOne({ phone: identifier })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: `No account found with this ${isEmail ? 'email' : 'phone number'}` },
        { status: 404 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save reset token to user
    user.resetToken = resetToken
    user.resetTokenExpiry = resetTokenExpiry
    await user.save()

    // In a real application, you would send SMS/Email here
    console.log(`Password reset token for ${identifier}: ${resetToken}`)

    if (isEmail) {
      // TODO: Implement email sending service
      // await sendEmail(identifier, `Your KASU password reset code is: ${resetToken}`)
    } else {
      // TODO: Implement SMS sending service
      // await sendSMS(identifier, `Your KASU password reset code is: ${resetToken}`)
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions sent to your ${isEmail ? 'email' : 'phone'}`,
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}