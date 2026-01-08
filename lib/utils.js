import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from './mongodb.js'

const JWT_SECRET = process.env.JWT_SECRET || 'kasu-secret-key-2024'

// Password utilities
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword)
}

// JWT utilities
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Phone number validation
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Aadhar validation
export const validateAadhar = (aadhar) => {
  const aadharRegex = /^\d{12}$/
  return aadharRegex.test(aadhar)
}

// PAN validation
export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

// Generate unique transaction ID
export const generateTransactionId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `TXN_${timestamp}_${random}`.toUpperCase()
}

// Generate device ID
export const generateDeviceId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `KASU_${timestamp}_${random}`.toUpperCase()
}

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount / 100) // Convert paise to rupees
}

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Calculate true balance
export const calculateTrueBalance = async (db, profileId) => {
  const transactions = db.collection('transactions')
  
  // Get all transactions for this profile
  const userTransactions = await transactions.find({
    $or: [
      { sender_profile_id: profileId },
      { receiver_profile_id: profileId }
    ]
  }).toArray()
  
  let balance = 0
  
  userTransactions.forEach(tx => {
    if (tx.sender_profile_id === profileId) {
      // Outgoing transaction
      if (tx.type === 'send' || tx.type === 'debit') {
        balance -= tx.amount_paise
      }
    }
    
    if (tx.receiver_profile_id === profileId) {
      // Incoming transaction
      if (tx.type === 'receive' || tx.type === 'credit' || tx.type === 'addMoney' || tx.type === 'topup' || tx.type === 'refund') {
        balance += tx.amount_paise
      }
    }
  })
  
  return balance
}

// API Response helper
export const apiResponse = (success, message, data = null, status = 200) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    status
  }
}

// API Key verification for ESP32 devices
export const verifyApiKey = (apiKey) => {
  const validApiKeys = [
    'KASU_ESP32_SECRET_KEY_2024',
    process.env.ESP32_API_KEY
  ]
  return validApiKeys.includes(apiKey)
}

// Generate profile ID from phone number
export const generateProfileId = (phone) => {
  const timestamp = Date.now().toString(36)
  const phoneHash = phone.slice(-4) // Last 4 digits
  return `PROF_${phoneHash}_${timestamp}`.toUpperCase()
}

// Validate transaction data
export const validateTransaction = (data) => {
  const required = ['tx_id', 'sender_profile_id', 'amount_paise', 'type']
  
  for (const field of required) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }
  
  if (data.amount_paise <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  
  const validTypes = ['send', 'receive', 'addMoney', 'refund', 'debit', 'credit', 'topup']
  if (!validTypes.includes(data.type)) {
    return { valid: false, error: 'Invalid transaction type' }
  }
  
  return { valid: true }
}

// Reconcile user balance with calculated balance
export const reconcileBalance = async (db, profileId) => {
  const users = db.collection('users')
  const user = await users.findOne({ profile_id: profileId })
  
  if (!user) {
    return { error: 'User not found' }
  }
  
  const calculatedBalance = await calculateTrueBalance(db, profileId)
  const storedBalance = user.balance || 0
  const discrepancy = calculatedBalance - storedBalance
  
  if (discrepancy !== 0) {
    // Update stored balance to match calculated balance
    await users.updateOne(
      { profile_id: profileId },
      { 
        $set: { 
          balance: calculatedBalance,
          updated_at: new Date(),
          last_reconciliation: new Date()
        }
      }
    )
    
    return {
      reconciled: true,
      old_balance: storedBalance,
      new_balance: calculatedBalance,
      adjustment: discrepancy
    }
  }
  
  return {
    reconciled: false,
    balance: storedBalance,
    message: 'Balance already in sync'
  }
}

// Legacy MongoDB connection function for backward compatibility
export const connectToDatabase = async () => {
  const mongoose = await connectDB()
  return {
    client: mongoose.connection.getClient(),
    db: mongoose.connection.db
  }
}

// Error handler
export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0]
    return apiResponse(false, `${field} already exists`, null, 400)
  }
  
  return apiResponse(false, error.message || 'Internal server error', null, 500)
}