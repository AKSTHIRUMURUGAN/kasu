import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Transaction } from '@/lib/models'
import { verifyToken, createErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const authResult = verifyToken(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    const userPhone = (authResult.user as any).phone
    if (!userPhone) {
      return createErrorResponse('Invalid user data', 400)
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // Timestamp to get transactions since
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    const query: any = {
      $or: [
        { 'from.phone': userPhone },
        { 'to.phone': userPhone }
      ]
    }

    // Add timestamp filter if provided
    if (since) {
      query.timestamp = { $gt: new Date(parseInt(since)) }
    }

    // Get recent transactions
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('from.userId', 'name phone')
      .populate('to.userId', 'name phone')

    // Format transactions for response
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      mode: tx.mode,
      timestamp: tx.timestamp,
      from: {
        phone: tx.from.phone,
        name: tx.from.userId?.name || 'Unknown'
      },
      to: {
        phone: tx.to.phone,
        name: tx.to.userId?.name || 'Unknown'
      },
      description: tx.description,
      deviceMac: tx.deviceMac,
      offlineSyncId: tx.offlineSyncId,
      cloudVerified: tx.cloudVerified,
      isIncoming: tx.to.phone === userPhone,
      isOutgoing: tx.from.phone === userPhone
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Live transactions error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}