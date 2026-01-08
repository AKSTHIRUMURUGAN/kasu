import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
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

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      
      const Transaction = require('@/lib/models').Transaction
      
      // Get transactions for the user (both sent and received)
      const transactions = await Transaction.find({
        $or: [
          { 'from.userId': decoded.userId },
          { 'to.userId': decoded.userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50)

      return NextResponse.json({
        success: true,
        transactions: transactions.map((tx: any) => ({
          _id: tx._id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          mode: tx.mode,
          timestamp: tx.timestamp,
          from: tx.from,
          to: tx.to,
          cloudVerified: tx.cloudVerified
        }))
      })

    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}