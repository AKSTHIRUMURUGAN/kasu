import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models'
import { Transaction } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { phone, password, macAddress, localTransactions, localBalance } = body

    // Validate required fields
    if (!phone || !password || !macAddress) {
      return NextResponse.json(
        { success: false, message: 'Phone, password, and MAC address are required' },
        { status: 400 }
      )
    }

    // Find user by phone
    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password (in production, you might want to use a different auth method for devices)
    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if device is assigned to this user
    if (!user.kasuDevice || user.kasuDevice.macAddress !== macAddress) {
      return NextResponse.json(
        { success: false, message: 'Device not assigned to this user' },
        { status: 403 }
      )
    }

    // Update device last sync time
    user.kasuDevice.status = 'active'
    await user.save()

    // Process local transactions if provided
    const syncedTransactions = []
    if (localTransactions && Array.isArray(localTransactions)) {
      for (const localTx of localTransactions) {
        try {
          // Check if transaction already exists
          const existingTx = await Transaction.findOne({ 
            offlineSyncId: localTx.offlineSyncId 
          })
          
          if (!existingTx) {
            // Create new transaction
            const transaction = new Transaction({
              type: localTx.type,
              from: {
                userId: user._id,
                phone: user.phone
              },
              to: {
                userId: localTx.recipientUserId || user._id,
                phone: localTx.recipientPhone || user.phone
              },
              amount: localTx.amount,
              status: localTx.status || 'success',
              mode: localTx.mode || 'device-to-device',
              offlineSyncId: localTx.offlineSyncId,
              cloudVerified: true,
              timestamp: new Date(localTx.timestamp),
              deviceMac: macAddress,
              description: localTx.description || ''
            })

            await transaction.save()
            syncedTransactions.push(transaction._id)

            // Update balances based on transaction type
            if (localTx.type === 'send') {
              // For send transactions, we might need to update recipient balance
              if (localTx.recipientPhone && localTx.recipientPhone !== user.phone) {
                const recipient = await User.findOne({ phone: localTx.recipientPhone })
                if (recipient) {
                  recipient.balance += localTx.amount
                  await recipient.save()
                }
              }
            }
          }
        } catch (txError) {
          console.error('Error processing transaction:', txError)
        }
      }
    }

    // Calculate true balance from all transactions
    const allTransactions = await Transaction.find({
      $or: [
        { 'from.userId': user._id },
        { 'to.userId': user._id }
      ]
    })

    let calculatedBalance = 0
    for (const tx of allTransactions) {
      if (tx.type === 'addMoney' || tx.type === 'receive') {
        calculatedBalance += tx.amount
      } else if (tx.type === 'send') {
        calculatedBalance -= tx.amount
      }
    }

    // Update user balance if there's a discrepancy
    if (user.balance !== calculatedBalance) {
      user.balance = calculatedBalance
      await user.save()
    }

    // Get recent transactions for the device
    const recentTransactions = await Transaction.find({
      $or: [
        { 'from.userId': user._id },
        { 'to.userId': user._id }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          balance: user.balance,
          status: user.status
        },
        syncedTransactions: syncedTransactions.length,
        currentBalance: user.balance,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx._id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          timestamp: tx.timestamp,
          from: tx.from,
          to: tx.to
        }))
      }
    })

  } catch (error) {
    console.error('Device sync error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for device status check
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const macAddress = searchParams.get('mac')

    if (!phone || !macAddress) {
      return NextResponse.json(
        { success: false, message: 'Phone and MAC address are required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.kasuDevice || user.kasuDevice.macAddress !== macAddress) {
      return NextResponse.json(
        { success: false, message: 'Device not assigned to this user' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          balance: user.balance,
          status: user.status
        },
        device: {
          macAddress: user.kasuDevice.macAddress,
          status: user.kasuDevice.status,
          assignedAt: user.kasuDevice.assignedAt
        }
      }
    })

  } catch (error) {
    console.error('Device status check error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}