import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Razorpay from 'razorpay'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format')
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    console.log('Token extracted:', token ? 'Yes' : 'No')
    
    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
      console.log('JWT Secret available:', jwtSecret ? 'Yes' : 'No')
      
      decoded = jwt.verify(token, jwtSecret) as any
      console.log('Token decoded successfully, userId:', decoded.userId)
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError.message)
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check Razorpay credentials
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
    
    console.log('Razorpay Key ID available:', razorpayKeyId ? 'Yes' : 'No')
    console.log('Razorpay Key Secret available:', razorpayKeySecret ? 'Yes' : 'No')

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing!')
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Initialize Razorpay and create order
    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      })

      console.log('Razorpay initialized successfully')

      // Convert amount to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = Math.round(amount * 100)
      console.log('Creating order for amount:', amountInPaise, 'paise')

      // Create a short receipt ID (max 40 characters)
      // Format: rcpt_[last8ofUserId]_[timestamp]
      const userIdShort = decoded.userId.toString().slice(-8)
      const timestamp = Date.now().toString().slice(-8)
      const receiptId = `rcpt_${userIdShort}_${timestamp}`
      console.log('Receipt ID:', receiptId, '(length:', receiptId.length, ')')

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          userId: decoded.userId,
          purpose: 'Add money to KASU wallet'
        }
      })

      console.log('Order created successfully:', order.id)

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      })

    } catch (razorpayError: any) {
      console.error('Razorpay order creation error:', razorpayError.message)
      console.error('Full Razorpay error:', razorpayError)
      return NextResponse.json(
        { success: false, message: 'Failed to create payment order' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
