import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyApiKey } from '@/lib/utils';

export async function POST(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const pendingCollection = db.collection('pending_sync');
    
    // Get all pending syncs
    const pendingSyncs = await pendingCollection
      .find({ retry_count: { $lt: 5 } })
      .sort({ created_at: 1 })
      .limit(20)
      .toArray();
    
    if (pendingSyncs.length === 0) {
      await client.close();
      return NextResponse.json({
        success: true,
        data: {
          pending_count: 0,
          message: 'No pending syncs'
        }
      });
    }
    
    const results = [];
    const transactions = db.collection('transactions');
    
    // Process each pending sync
    for (const pending of pendingSyncs) {
      try {
        // Check if already exists
        const existing = await transactions.findOne({ tx_id: pending.data.tx_id });
        if (existing) {
          // Remove from pending
          await pendingCollection.deleteOne({ _id: pending._id });
          results.push({
            tx_id: pending.data.tx_id,
            status: 'already_exists',
            message: 'Transaction already synced'
          });
          continue;
        }
        
        // Sync transaction
        const txDoc = {
          ...pending.data,
          synced_at: new Date(),
          needs_sync: false,
          sync_attempts: 0,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await transactions.insertOne(txDoc);
        
        // Update user balances (similar to transaction route)
        // ... balance update logic here ...
        
        // Remove from pending
        await pendingCollection.deleteOne({ _id: pending._id });
        
        results.push({
          tx_id: pending.data.tx_id,
          status: 'synced',
          message: 'Successfully synced'
        });
        
      } catch (error) {
        // Update retry count
        await pendingCollection.updateOne(
          { _id: pending._id },
          {
            $inc: { retry_count: 1 },
            $set: { last_attempt: new Date() }
          }
        );
        
        results.push({
          tx_id: pending.data.tx_id,
          status: 'failed',
          error: error.message,
          retry_count: pending.retry_count + 1
        });
      }
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results: results,
        summary: {
          synced: results.filter(r => r.status === 'synced').length,
          failed: results.filter(r => r.status === 'failed').length,
          existing: results.filter(r => r.status === 'already_exists').length
        }
      }
    });
    
  } catch (error) {
    console.error('Process pending error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}