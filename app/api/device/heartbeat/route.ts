import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { macAddress, phone, batteryLevel, localBalance, localTransactions } = body

    if (!macAddress || !phone) {
      return NextResponse.json(
        { success: false, message: 'MAC address and phone are required' },
        { status: 400 }
      )
    }

    console.log(`📡 Heartbeat from device ${macAddress} (${phone})`)

    // Find the user and device
    const user = await User.findOne({ phone })
    const device = await KasuDevice.findOne({ macAddress })

    if (!user || !device) {
      return NextResponse.json(
        { success: false, message: 'User or device not found' },
        { status: 404 }
      )
    }

    // Verify device belongs to user
    if (!user.kasuDevice || user.kasuDevice.macAddress !== macAddress) {
      return NextResponse.json(
        { success: false, message: 'Device not assigned to this user' },
        { status: 403 }
      )
    }

    // Check if this is the first connection
    const firstConnection = user.kasuDevice?.connectionStatus === 'unknown' || 
                           user.kasuDevice?.connectionStatus === 'offline'

    // Update user device status
    user.kasuDevice.connectionStatus = 'online'
    user.kasuDevice.lastSeen = new Date()
    if (user.kasuDevice.status === 'assigned') {
      user.kasuDevice.status = 'active'
    }

    // Update device status
    device.status = 'active'
    device.lastSync = new Date()
    if (batteryLevel !== undefined) {
      device.deviceInfo.batteryLevel = batteryLevel
    }

    // Process local transactions if provided
    let syncedTransactions = 0
    let updatedBalance = user.balance

    if (localTransactions && Array.isArray(localTransactions)) {
      console.log(`📝 Processing ${localTransactions.length} local transactions`)
      
      const { Transaction } = require('@/lib/models')
      
      for (const localTx of localTransactions) {
        try {
          // Check if transaction already exists
          const existingTx = await Transaction.findOne({ 
            offlineSyncId: localTx.offlineSyncId 
          })
          
          if (!existingTx) {
            // Validate transaction data
            if (!localTx.offlineSyncId || !localTx.type || !localTx.amount) {
              console.log('❌ Invalid transaction data:', localTx)
              continue
            }

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
              mode: 'device-to-device',
              offlineSyncId: localTx.offlineSyncId,
              cloudVerified: true,
              timestamp: new Date(localTx.timestamp || Date.now()),
              deviceMac: macAddress,
              description: localTx.description || `Device transaction ${localTx.type}`
            })

            await transaction.save()
            syncedTransactions++

            console.log(`✅ Synced transaction: ${localTx.offlineSyncId} (${localTx.type}, ₹${localTx.amount/100})`)

            // Update balances based on transaction type
            if (localTx.type === 'send') {
              updatedBalance -= localTx.amount
              
              // Update recipient balance if different user
              if (localTx.recipientPhone && localTx.recipientPhone !== user.phone) {
                const recipient = await User.findOne({ phone: localTx.recipientPhone })
                if (recipient) {
                  recipient.balance += localTx.amount
                  await recipient.save()
                  console.log(`💰 Updated recipient balance: ${localTx.recipientPhone} +₹${localTx.amount/100}`)
                }
              }
            } else if (localTx.type === 'receive') {
              updatedBalance += localTx.amount
            }
          } else {
            console.log(`⚠️ Transaction already synced: ${localTx.offlineSyncId}`)
          }
        } catch (txError) {
          console.error('❌ Error processing transaction:', txError)
        }
      }

      // Update user balance if transactions were processed
      if (syncedTransactions > 0) {
        user.balance = updatedBalance
        console.log(`💰 Updated user balance: ₹${updatedBalance/100} (synced ${syncedTransactions} transactions)`)
      }
    }

    // Update device localBalance AFTER processing transactions to reflect the correct balance
    device.localBalance = user.balance
    console.log(`📱 Device localBalance updated to: ₹${user.balance/100}`)

    await user.save()
    await device.save()

    // Get recent transactions for response
    const { Transaction } = require('@/lib/models')
    const recentTransactions = await Transaction.find({
      $or: [
        { 'from.userId': user._id },
        { 'to.userId': user._id }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(5)

    return NextResponse.json({
      success: true,
      message: 'Heartbeat received',
      firstConnection,
      syncedTransactions,
      device: {
        macAddress: device.macAddress,
        status: device.status,
        connectionStatus: 'online',
        lastSeen: user.kasuDevice.lastSeen,
        localBalance: device.localBalance,
        batteryLevel: device.deviceInfo.batteryLevel
      },
      user: {
        balance: user.balance,
        name: user.name,
        phone: user.phone
      },
      recentTransactions: recentTransactions.map((tx: any) => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        timestamp: tx.timestamp,
        description: tx.description
      }))
    })

  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}