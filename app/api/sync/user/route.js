import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyApiKey, generateProfileId } from '@/lib/utils';

export async function POST(request) {
  try {
    // Check API key from headers
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { client, db } = await connectToDatabase();
    
    const users = db.collection('users');
    const profileId = data.profile_id || generateProfileId(data.phone);
    
    // Check if user exists
    const existingUser = await users.findOne({ profile_id: profileId });
    
    if (existingUser) {
      // Update existing user
      const updateData = {
        name: data.name || existingUser.name,
        balance: data.balance !== undefined ? data.balance : existingUser.balance,
        last_sync: new Date(),
        updated_at: new Date()
      };
      
      // Add device if not already associated
      if (data.device_id && !existingUser.device_ids?.includes(data.device_id)) {
        updateData.$push = { device_ids: data.device_id };
        updateData.last_device = data.device_id;
      }
      
      await users.updateOne(
        { profile_id: profileId },
        { $set: updateData }
      );
      
    } else {
      // Create new user
      await users.insertOne({
        profile_id: profileId,
        name: data.name,
        phone: data.phone,
        balance: data.balance || 0,
        initial_balance: data.balance || 0,
        device_ids: data.device_id ? [data.device_id] : [],
        last_device: data.device_id,
        last_sync: new Date(),
        sync_count: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Get updated user
    const user = await users.findOne({ profile_id: profileId });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        profile_id: user.profile_id,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        last_sync: user.last_sync
      }
    });
    
  } catch (error) {
    console.error('User sync error:', error);
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
    const phone = searchParams.get('phone');
    const profileId = searchParams.get('profile_id');
    
    if (!phone && !profileId) {
      return NextResponse.json(
        { success: false, error: 'Phone or profile ID required' },
        { status: 400 }
      );
    }
    
    const { client, db } = await connectToDatabase();
    const users = db.collection('users');
    
    const query = profileId 
      ? { profile_id: profileId }
      : { phone: phone };
    
    const user = await users.findOne(query);
    
    await client.close();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        profile_id: user.profile_id,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        last_sync: user.last_sync
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}