import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyApiKey, validateTransaction, reconcileBalance } from '@/lib/utils';

export async function POST(request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    console.log('📝 Transaction sync request:', data);
    
    // Validate transaction data
    const validation = validateTransaction(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const transactions = db.collection('transactions');
    const users = db.collection('users');
    
    // Check if transaction already exists
    const existingTx = await transactions.findOne({ tx_id: data.tx_id });
    if (existingTx) {
      // DON'T CLOSE CLIENT
      return NextResponse.json({
        success: true,
        message: 'Transaction already synced',
        data: {
          tx_id: existingTx.tx_id,
          cloud_id: existingTx._id.toString(),
          synced_at: existingTx.synced_at
        }
      });
    }
    
    // Prepare transaction document
    const txDoc = {
      tx_id: data.tx_id,
      local_timestamp: data.local_timestamp || Date.now(),
      
      // User info
      sender_profile_id: data.sender_profile_id,
      receiver_profile_id: data.receiver_profile_id,
      sender_phone: data.sender_phone,
      receiver_phone: data.receiver_phone,
      
      // Transaction details
      amount_paise: data.amount_paise,
      amount_rupees: data.amount_paise / 100,
      type: data.type,
      mode: data.mode || 'offline',
      status: data.status || 'completed',
      description: data.description || `Transaction ${data.type}`,
      
      // Device info
      device_id: data.device_id,
      device_mac: data.device_mac || data.device_id,
      
      // Sync info
      synced_at: new Date(),
      needs_sync: false,
      sync_attempts: 0,
      
      // Reconciliation
      reconciled: false,
      
      // Timestamps
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert transaction
    const result = await transactions.insertOne(txDoc);
    
    // Update user balances if transaction is completed
    if (txDoc.status === 'completed') {
      if (txDoc.type === 'send' || txDoc.type === 'debit') {
        // Deduct from sender
        await users.updateOne(
          { profile_id: txDoc.sender_profile_id },
          { 
            $inc: { balance: -txDoc.amount_paise },
            $set: { updated_at: new Date() }
          }
        );
        
        // Add to receiver if not self
        if (txDoc.sender_profile_id !== txDoc.receiver_profile_id) {
          await users.updateOne(
            { profile_id: txDoc.receiver_profile_id },
            { 
              $inc: { balance: txDoc.amount_paise },
              $set: { updated_at: new Date() }
            }
          );
        }
      } else if (txDoc.type === 'receive' || txDoc.type === 'credit' || txDoc.type === 'topup') {
        // Add to receiver
        await users.updateOne(
          { profile_id: txDoc.receiver_profile_id },
          { 
            $inc: { balance: txDoc.amount_paise },
            $set: { updated_at: new Date() }
          }
        );
      }
      
      // Reconcile balances
      await reconcileBalance(db, txDoc.sender_profile_id);
      if (txDoc.sender_profile_id !== txDoc.receiver_profile_id) {
        await reconcileBalance(db, txDoc.receiver_profile_id);
      }
    }
    
    // DON'T CLOSE CLIENT - Let connection pooling handle it
    // await client.close(); // ❌ This was causing the error!
    
    console.log('✅ Transaction synced:', data.tx_id);
    
    return NextResponse.json({
      success: true,
      data: {
        tx_id: txDoc.tx_id,
        cloud_id: result.insertedId.toString(),
        synced_at: txDoc.synced_at,
        amount: txDoc.amount_rupees,
        type: txDoc.type
      }
    });
    
  } catch (error) {
    console.error('Transaction sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID required' },
        { status: 400 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const transactions = db.collection('transactions');
    
    // Get transactions where user is sender or receiver
    const userTransactions = await transactions
      .find({
        $or: [
          { sender_profile_id: profileId },
          { receiver_profile_id: profileId }
        ]
      })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // DON'T CLOSE CLIENT
    // await client.close(); // ❌ This was causing the error!
    
    return NextResponse.json({
      success: true,
      data: {
        transactions: userTransactions.map(tx => ({
          tx_id: tx.tx_id,
          sender: tx.sender_phone,
          receiver: tx.receiver_phone,
          amount: tx.amount_rupees,
          type: tx.type,
          mode: tx.mode,
          status: tx.status,
          description: tx.description,
          timestamp: tx.created_at
        })),
        count: userTransactions.length,
        total: await transactions.countDocuments({
          $or: [
            { sender_profile_id: profileId },
            { receiver_profile_id: profileId }
          ]
        })
      }
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}