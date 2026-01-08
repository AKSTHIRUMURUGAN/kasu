import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { KasuDevice, Transaction } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { macAddress, phone, batteryLevel, localBalance, localTransactions } = body

    console.log(`📡 ESP32 Heartbeat: ${macAddress} (${phone})`)

    if (!macAddress || !phone) {
      return NextResponse.json(
        { success: false, message: 'MAC address and phone are required' },
        { status: 400 }
      )
    }

    // Find the user by phone
    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
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

    // Find device in KasuDevice collection
    const device = await KasuDevice.findOne({ macAddress })
    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Device not found in system' },
        { status: 404 }
      )
    }

    console.log(`✅ Device verified: ${macAddress} belongs to ${phone}`)

    // Check if this is the first connection
    const firstConnection = user.kasuDevice?.connectionStatus !== 'online'

    // Update user device status
    user.kasuDevice.connectionStatus = 'online'
    user.kasuDevice.lastSeen = new Date()
    if (user.kasuDevice.status === 'assigned') {
      user.kasuDevice.status = 'active'
    }

    // Update device status
    device.status = 'active'
    device.lastSync = new Date()
    if (localBalance !== undefined) {
      device.localBalance = localBalance
    }
    if (batteryLevel !== undefined) {
      device.deviceInfo.batteryLevel = batteryLevel
    }

    // Process local transactions if provided
    let syncedTransactions = 0
    let updatedBalance = user.balance
    const syncResults = []

    if (localTransactions && Array.isArray(localTransactions)) {
      console.log(`📝 Processing ${localTransactions.length} local transactions`)
      
      for (const localTx of localTransactions) {
        try {
          // Validate required fields
          if (!localTx.offlineSyncId || !localTx.type || localTx.amount === undefined) {
            console.log('❌ Invalid transaction data:', localTx)
            syncResults.push({
              offlineSyncId: localTx.offlineSyncId || 'unknown',
              status: 'failed',
              error: 'Missing required fields'
            })
            continue
          }

          // Check if transaction already exists
          const existingTx = await Transaction.findOne({ 
            offlineSyncId: localTx.offlineSyncId 
          })
          
          if (existingTx) {
            console.log(`⚠️ Transaction already synced: ${localTx.offlineSyncId}`)
            syncResults.push({
              offlineSyncId: localTx.offlineSyncId,
              status: 'already_synced',
              cloudId: existingTx._id
            })
            continue
          }

          // Determine transaction participants
          let fromUser = user
          let toUser = user
          
          if (localTx.recipientPhone && localTx.recipientPhone !== phone) {
            toUser = await User.findOne({ phone: localTx.recipientPhone })
            if (!toUser) {
              console.log(`❌ Recipient not found: ${localTx.recipientPhone}`)
              syncResults.push({
                offlineSyncId: localTx.offlineSyncId,
                status: 'failed',
                error: 'Recipient not found'
              })
              continue
            }
          }

          // Create new transaction
          const transaction = new Transaction({
            type: localTx.type,
            from: {
              userId: fromUser._id,
              phone: fromUser.phone
            },
            to: {
              userId: toUser._id,
              phone: toUser.phone
            },
            amount: localTx.amount,
            status: localTx.status || 'success',
            mode: 'device-to-device',
            offlineSyncId: localTx.offlineSyncId,
            cloudVerified: true,
            timestamp: new Date(localTx.timestamp || Date.now()),
            deviceMac: macAddress,
            description: localTx.description || `Device ${localTx.type} transaction`
          })

          await transaction.save()
          syncedTransactions++

          console.log(`✅ Synced transaction: ${localTx.offlineSyncId} (${localTx.type}, ₹${localTx.amount/100})`)

          // Update balances based on transaction type
          if (localTx.type === 'send') {
            updatedBalance -= localTx.amount
            
            // Update recipient balance if different user
            if (toUser._id.toString() !== fromUser._id.toString()) {
              toUser.balance += localTx.amount
              await toUser.save()
              console.log(`💰 Updated recipient balance: ${toUser.phone} +₹${localTx.amount/100}`)
            }
          } else if (localTx.type === 'receive') {
            updatedBalance += localTx.amount
          } else if (localTx.type === 'addMoney') {
            updatedBalance += localTx.amount
          }

          syncResults.push({
            offlineSyncId: localTx.offlineSyncId,
            status: 'synced',
            cloudId: transaction._id,
            type: localTx.type,
            amount: localTx.amount
          })

        } catch (txError) {
          console.error('❌ Error processing transaction:', txError)
          syncResults.push({
            offlineSyncId: localTx.offlineSyncId || 'unknown',
            status: 'failed',
            error: txError instanceof Error ? txError.message : 'Unknown error'
          })
        }
      }

      // Update user balance if transactions were processed
      if (syncedTransactions > 0) {
        user.balance = updatedBalance
        console.log(`💰 Updated user balance: ₹${updatedBalance/100} (synced ${syncedTransactions} transactions)`)
      }
    }

    // Save updates
    await user.save()
    await device.save()

    // Get recent transactions for device
    const recentTransactions = await Transaction.find({
      $or: [
        { 'from.userId': user._id },
        { 'to.userId': user._id }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)

    const response = {
      success: true,
      message: 'Heartbeat processed successfully',
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
        phone: user.phone,
        status: user.status
      },
      syncResults,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        timestamp: tx.timestamp,
        from: tx.from.phone,
        to: tx.to.phone,
        description: tx.description
      }))
    }

    console.log(`📡 Heartbeat response: ${syncedTransactions} transactions synced, balance: ₹${user.balance/100}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Heartbeat error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}