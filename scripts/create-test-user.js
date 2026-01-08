const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User Schema (simplified for script)
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'super_admin'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'active', 'blocked'], 
    default: 'pending' 
  },
  kasuDevice: {
    macAddress: { type: String },
    assignedAt: { type: Date },
    status: { type: String, enum: ['unassigned', 'assigned', 'active', 'inactive'], default: 'unassigned' },
    connectionStatus: { type: String, enum: ['online', 'offline', 'unknown'], default: 'unknown' },
    lastSeen: { type: Date }
  },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://kasu:kasu@kasu.soalioi.mongodb.net/kasu?appName=kasu')
    console.log('Connected to MongoDB')

    const hashedPassword = await bcrypt.hash('user123', 12)
    
    // Create test users with different device states
    const testUsers = [
      {
        phone: '9876543210',
        email: 'user1@test.com',
        password: hashedPassword,
        name: 'Test User 1',
        role: 'user',
        status: 'active',
        balance: 50000, // ₹500.00
        kasuDevice: {
          macAddress: 'AA:BB:CC:DD:EE:01',
          assignedAt: new Date(),
          status: 'assigned',
          connectionStatus: 'unknown', // Never connected
          lastSeen: null
        }
      },
      {
        phone: '9876543211',
        email: 'user2@test.com',
        password: hashedPassword,
        name: 'Test User 2',
        role: 'user',
        status: 'active',
        balance: 75000, // ₹750.00
        kasuDevice: {
          macAddress: 'AA:BB:CC:DD:EE:02',
          assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Assigned yesterday
          status: 'active',
          connectionStatus: 'online', // Currently online
          lastSeen: new Date()
        }
      },
      {
        phone: '9876543212',
        email: 'user3@test.com',
        password: hashedPassword,
        name: 'Test User 3',
        role: 'user',
        status: 'active',
        balance: 25000, // ₹250.00
        kasuDevice: {
          macAddress: 'AA:BB:CC:DD:EE:03',
          assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // Assigned 2 days ago
          status: 'active',
          connectionStatus: 'offline', // Offline
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last seen 2 hours ago
        }
      },
      {
        phone: '9876543213',
        email: 'user4@test.com',
        password: hashedPassword,
        name: 'Test User 4',
        role: 'user',
        status: 'verified', // Verified but no device assigned
        balance: 0
        // No kasuDevice - completely unassigned
      }
    ]

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ phone: userData.phone })
        if (existingUser) {
          console.log(`User ${userData.phone} already exists, updating...`)
          await User.updateOne({ phone: userData.phone }, userData)
        } else {
          const user = new User(userData)
          await user.save()
          console.log(`Created user: ${userData.name} (${userData.phone})`)
        }
      } catch (error) {
        console.log(`Error with user ${userData.phone}:`, error.message)
      }
    }
    
    console.log('\nTest users created/updated successfully!')
    console.log('You can now see different device states in the admin panel:')
    console.log('- User 1: Assigned but never connected (Unknown status)')
    console.log('- User 2: Assigned and currently online (Connected)')
    console.log('- User 3: Assigned but offline (Not Connected)')
    console.log('- User 4: No device assigned (Not Assigned)')
    
  } catch (error) {
    console.error('Error creating test users:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

createTestUsers()