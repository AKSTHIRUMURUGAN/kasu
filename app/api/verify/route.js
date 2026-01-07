import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyApiKey } from '@/lib/utils';

export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const phone = request.headers.get('x-phone');
    
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const users = db.collection('users');
    const transactions = db.collection('transactions');
    
    // Get stats
    const userCount = await users.countDocuments();
    const txCount = await transactions.countDocuments();
    
    // Get recent activity
    const recentTransactions = await transactions
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    // Get system health
    const pendingSyncs = await db.collection('pending_sync').countDocuments();
    const failedSyncs = await db.collection('pending_sync')
      .countDocuments({ retry_count: { $gte: 3 } });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        stats: {
          users: userCount,
          transactions: txCount,
          pending_syncs: pendingSyncs,
          failed_syncs: failedSyncs
        },
        recent_activity: recentTransactions.map(tx => ({
          tx_id: tx.tx_id,
          amount: tx.amount_rupees,
          type: tx.type,
          status: tx.status,
          timestamp: tx.created_at
        })),
        endpoints: [
          { name: 'Sync User', method: 'POST', path: '/api/sync/user' },
          { name: 'Sync Transaction', method: 'POST', path: '/api/sync/transaction' },
          { name: 'Get Balance', method: 'GET', path: '/api/sync/balance' },
          { name: 'Process Pending', method: 'POST', path: '/api/sync/pending' }
        ]
      }
    });
    
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        status: 'degraded'
      },
      { status: 500 }
    );
  }
}