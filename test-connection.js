// Simple test script to verify MongoDB connection
import { connectToDatabase } from './lib/mongodb.js';

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    const { client, db } = await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test basic operations
    const users = db.collection('users');
    const count = await users.countDocuments();
    console.log(`📊 Found ${count} users in database`);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();