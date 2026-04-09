import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const body = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount 
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment details' },
        { status: 400 }
      )
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      
      const user = await User.findById(decoded.userId)
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }

      // Verify Razorpay signature
      const body_string = razorpay_order_id + '|' + razorpay_payment_id
      const expected_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body_string)
        .digest('hex')

      if (expected_signature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, message: 'Payment verification failed' },
          { status: 400 }
        )
      }

      // Payment verified successfully, update user balance
      const amountInPaise = Math.round(amount * 100)
      user.balance += amountInPaise
      await user.save()

      // Create transaction record
      const Transaction = require('@/lib/models').Transaction
      const transaction = new Transaction({
        type: 'addMoney',
        from: {
          userId: user._id,
          phone: user.phone
        },
        to: {
          userId: user._id,
          phone: user.phone
        },
        amount: amountInPaise,
        status: 'success',
        mode: 'online',
        cloudVerified: true,
        timestamp: new Date(),
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        description: 'Money added via Razorpay'
      })

      await transaction.save()

      return NextResponse.json({
        success: true,
        message: `₹${amount} added successfully`,
        newBalance: user.balance,
        transaction: {
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          timestamp: transaction.timestamp,
          paymentId: razorpay_payment_id
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
