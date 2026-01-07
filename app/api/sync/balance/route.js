import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyApiKey, calculateTrueBalance, reconcileBalance } from '@/lib/utils';

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
    const phone = searchParams.get('phone');
    
    if (!profileId && !phone) {
      return NextResponse.json(
        { success: false, error: 'Profile ID or phone required' },
        { status: 400 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const users = db.collection('users');
    
    // Find user
    const query = profileId 
      ? { profile_id: profileId }
      : { phone: phone };
    
    const user = await users.findOne(query);
    
    if (!user) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Calculate true balance
    const calculatedBalance = await calculateTrueBalance(db, user.profile_id);
    let storedBalance = user.balance || 0;
    const discrepancy = Math.abs(storedBalance - calculatedBalance);
    
    // Reconcile if needed
    const reconcile = searchParams.get('reconcile') === 'true';
    let reconciliation = null;
    
    if (reconcile && discrepancy > 0) {
      reconciliation = await reconcileBalance(db, user.profile_id);
      
      // Get updated user
      const updatedUser = await users.findOne({ profile_id: user.profile_id });
      storedBalance = updatedUser.balance;
    }
    
    // Get recent transactions
    const transactions = db.collection('transactions');
    const recentTxs = await transactions
      .find({
        $or: [
          { sender_profile_id: user.profile_id },
          { receiver_profile_id: user.profile_id }
        ]
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        profile_id: user.profile_id,
        name: user.name,
        phone: user.phone,
        balance: {
          stored: storedBalance,
          stored_rupees: storedBalance / 100,
          calculated: calculatedBalance,
          calculated_rupees: calculatedBalance / 100,
          discrepancy: discrepancy,
          discrepancy_rupees: discrepancy / 100,
          in_sync: discrepancy === 0
        },
        reconciliation: reconciliation,
        recent_transactions: recentTxs.map(tx => ({
          tx_id: tx.tx_id,
          amount: tx.amount_rupees,
          type: tx.type,
          description: tx.description,
          timestamp: tx.created_at
        })),
        last_sync: user.last_sync,
        device_count: user.device_ids?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { profile_id, balance } = data;
    
    if (!profile_id || balance === undefined) {
      return NextResponse.json(
        { success: false, error: 'Profile ID and balance required' },
        { status: 400 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const users = db.collection('users');
    
    // Update user balance
    await users.updateOne(
      { profile_id: profile_id },
      {
        $set: {
          balance: balance,
          updated_at: new Date(),
          last_sync: new Date()
        }
      }
    );
    
    // Reconcile
    const reconciliation = await reconcileBalance(db, profile_id);
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        profile_id: profile_id,
        new_balance: balance,
        reconciliation: reconciliation
      }
    });
    
  } catch (error) {
    console.error('Update balance error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}