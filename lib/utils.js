import CryptoJS from 'crypto-js';

// Generate profile ID from phone (same as ESP32)
export function generateProfileId(phone) {
  return CryptoJS.SHA256('KASU_PROFILE|' + phone).toString();
}

// Generate transaction ID (same as ESP32)
export function generateTxId(profileId, timestamp, random) {
  return `tx_${profileId.substring(0, 8)}_${timestamp}_${random}`;
}

// Verify API key (for ESP32 authentication)
export function verifyApiKey(apiKey) {
  return apiKey === process.env.API_KEY;
}

// Calculate balance from transactions
export async function calculateTrueBalance(db, profileId) {
  const transactions = db.collection('transactions');
  
  // Sum all credits (received + topups + refunds)
  const credits = await transactions.aggregate([
    {
      $match: {
        receiver_profile_id: profileId,
        status: 'completed',
        type: { $in: ['receive', 'topup', 'refund'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount_paise' }
      }
    }
  ]).toArray();
  
  // Sum all debits (sent)
  const debits = await transactions.aggregate([
    {
      $match: {
        sender_profile_id: profileId,
        status: 'completed',
        type: 'send'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount_paise' }
      }
    }
  ]).toArray();
  
  const totalCredits = credits[0]?.total || 0;
  const totalDebits = debits[0]?.total || 0;
  
  return totalCredits - totalDebits;
}

// Reconcile user balance
export async function reconcileBalance(db, profileId) {
  const users = db.collection('users');
  const user = await users.findOne({ profile_id: profileId });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const calculatedBalance = await calculateTrueBalance(db, profileId);
  const storedBalance = user.balance || 0;
  const discrepancy = Math.abs(storedBalance - calculatedBalance);
  
  // If discrepancy > 1 rupee, flag for review
  const needsReview = discrepancy > 100;
  
  // Auto-correct if small discrepancy
  if (!needsReview && discrepancy > 0) {
    await users.updateOne(
      { profile_id: profileId },
      {
        $set: {
          balance: calculatedBalance,
          updated_at: new Date()
        },
        $push: {
          balance_adjustments: {
            old_balance: storedBalance,
            new_balance: calculatedBalance,
            discrepancy: discrepancy,
            auto_corrected: true,
            timestamp: new Date()
          }
        }
      }
    );
    
    // Create adjustment transaction
    const transactions = db.collection('transactions');
    await transactions.insertOne({
      tx_id: `adj_${profileId}_${Date.now()}`,
      sender_profile_id: profileId,
      receiver_profile_id: profileId,
      sender_phone: user.phone,
      receiver_phone: user.phone,
      amount_paise: Math.abs(discrepancy),
      amount_rupees: Math.abs(discrepancy) / 100,
      type: 'adjustment',
      mode: 'reconciliation',
      status: 'completed',
      description: `Auto balance adjustment: ${discrepancy > 0 ? '+' : '-'}₹${Math.abs(discrepancy)/100}`,
      device_id: 'system',
      reconciled: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  return {
    stored_balance: storedBalance,
    calculated_balance: calculatedBalance,
    discrepancy: discrepancy,
    needs_review: needsReview,
    auto_corrected: !needsReview && discrepancy > 0
  };
}

// Validate transaction data
export function validateTransaction(data) {
  const required = [
    'tx_id', 'sender_profile_id', 'receiver_profile_id',
    'sender_phone', 'receiver_phone', 'amount_paise', 'type'
  ];
  
  for (const field of required) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate phone numbers
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(data.sender_phone) || !phoneRegex.test(data.receiver_phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  // Validate amount
  if (data.amount_paise <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  return { valid: true };
}