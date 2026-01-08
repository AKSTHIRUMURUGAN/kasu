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
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://kasu:kasu@kasu.soalioi.mongodb.net/kasu?appName=kasu')
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      process.exit(0)
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = new User({
      phone: '9999999999',
      email: 'admin@kasu.com',
      password: hashedPassword,
      name: 'KASU Admin',
      role: 'admin',
      status: 'active',
      balance: 0
    })

    await adminUser.save()
    console.log('Admin user created successfully!')
    console.log('Login with either:')
    console.log('Phone: 9999999999')
    console.log('Email: admin@kasu.com')
    console.log('Password: admin123')
    
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

createAdmin()