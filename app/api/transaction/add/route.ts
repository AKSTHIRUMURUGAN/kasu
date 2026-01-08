import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
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
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
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

      if (user.status !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Account not active. Please wait for admin approval.' },
          { status: 403 }
        )
      }

      // Convert amount to paise (multiply by 100)
      const amountInPaise = Math.round(amount * 100)

      // Update user balance
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
        timestamp: new Date()
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
          timestamp: transaction.timestamp
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Add money error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}