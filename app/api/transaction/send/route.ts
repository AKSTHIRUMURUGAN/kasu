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
    const { amount, recipientPhone } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!recipientPhone || recipientPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipient phone number' },
        { status: 400 }
      )
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      
      const sender = await User.findById(decoded.userId)
      if (!sender) {
        return NextResponse.json(
          { success: false, message: 'Sender not found' },
          { status: 404 }
        )
      }

      if (sender.status !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Account not active. Please wait for admin approval.' },
          { status: 403 }
        )
      }

      // Find recipient
      const recipient = await User.findOne({ phone: recipientPhone })
      if (!recipient) {
        return NextResponse.json(
          { success: false, message: 'Recipient not found' },
          { status: 404 }
        )
      }

      // Convert amount to paise
      const amountInPaise = Math.round(amount * 100)

      // Check sender balance
      if (sender.balance < amountInPaise) {
        return NextResponse.json(
          { success: false, message: 'Insufficient balance' },
          { status: 400 }
        )
      }

      // Perform transaction
      sender.balance -= amountInPaise
      recipient.balance += amountInPaise

      await sender.save()
      await recipient.save()

      // Create transaction records
      const Transaction = require('@/lib/models').Transaction
      
      // Sender transaction (debit)
      const senderTransaction = new Transaction({
        type: 'send',
        from: {
          userId: sender._id,
          phone: sender.phone
        },
        to: {
          userId: recipient._id,
          phone: recipient.phone
        },
        amount: amountInPaise,
        status: 'success',
        mode: 'online',
        cloudVerified: true,
        timestamp: new Date()
      })

      // Recipient transaction (credit)
      const recipientTransaction = new Transaction({
        type: 'receive',
        from: {
          userId: sender._id,
          phone: sender.phone
        },
        to: {
          userId: recipient._id,
          phone: recipient.phone
        },
        amount: amountInPaise,
        status: 'success',
        mode: 'online',
        cloudVerified: true,
        timestamp: new Date()
      })

      await senderTransaction.save()
      await recipientTransaction.save()

      return NextResponse.json({
        success: true,
        message: `₹${amount} sent successfully to ${recipientPhone}`,
        senderBalance: sender.balance,
        transaction: {
          id: senderTransaction._id,
          type: senderTransaction.type,
          amount: senderTransaction.amount,
          recipient: recipientPhone,
          status: senderTransaction.status,
          timestamp: senderTransaction.timestamp
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Send money error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}