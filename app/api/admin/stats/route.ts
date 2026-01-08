import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User, { Transaction, KasuDevice } from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }
    
    // Get user statistics
    const totalUsers = await User.countDocuments({})
    const activeUsers = await User.countDocuments({ status: 'active' })
    const pendingUsers = await User.countDocuments({ status: 'pending' })
    
    // Get device statistics with proper status handling
    const assignedDevices = await User.countDocuments({ 
      'kasuDevice.macAddress': { $exists: true, $ne: null },
      'kasuDevice.status': { $ne: 'unassigned' }
    })
    const activeDevices = await User.countDocuments({ 'kasuDevice.status': 'active' })
    const onlineDevices = await User.countDocuments({ 'kasuDevice.connectionStatus': 'online' })
    const unassignedDevices = await User.countDocuments({ 
      $or: [
        { 'kasuDevice.macAddress': { $exists: false } },
        { 'kasuDevice.macAddress': null },
        { 'kasuDevice.status': 'unassigned' }
      ]
    })

    // Calculate total balance
    const balanceResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' }
        }
      }
    ])
    const totalBalance = balanceResult.length > 0 ? balanceResult[0].totalBalance : 0

    // Get transaction count
    const totalTransactions = await Transaction.countDocuments({})

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalBalance,
        totalTransactions,
        activeDevices,
        assignedDevices,
        onlineDevices,
        unassignedDevices
      }
    })

  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}