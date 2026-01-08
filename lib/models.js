import mongoose from 'mongoose'

// User Schema
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
  aadhar: { type: String, unique: true },
  pan: { type: String, unique: true },
  drivingLicense: { type: String },
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
  documents: {
    aadharDoc: { type: String },
    panDoc: { type: String },
    dlDoc: { type: String }
  },
  medicalInfo: {
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    emergencyContact: { type: String }
  },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['addMoney', 'send', 'receive', 'refund'], 
    required: true 
  },
  from: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String }
  },
  to: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String }
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'processing'], 
    default: 'pending' 
  },
  mode: { 
    type: String, 
    enum: ['device-to-device', 'device-to-card', 'online'], 
    default: 'online' 
  },
  offlineSyncId: { type: String, unique: true, sparse: true },
  cloudVerified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  deviceMac: { type: String },
  description: { type: String },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String }
})

// KASU Device Schema
const kasuDeviceSchema = new mongoose.Schema({
  macAddress: { type: String, required: true, unique: true },
  phone: { type: String },
  status: { 
    type: String, 
    enum: ['unassigned', 'assigned', 'active', 'inactive'], 
    default: 'unassigned' 
  },
  lastSync: { type: Date },
  localBalance: { type: Number, default: 0 },
  syncQueue: { type: Array, default: [] },
  deviceInfo: {
    model: { type: String },
    firmware: { type: String },
    batteryLevel: { type: Number }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  permissions: [{ type: String }],
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema)
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)
const KasuDevice = mongoose.models.KasuDevice || mongoose.model('KasuDevice', kasuDeviceSchema)
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

export default User
export { Transaction, KasuDevice, Admin }