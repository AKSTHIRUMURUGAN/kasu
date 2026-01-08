const mongoose = require('mongoose')

// KASU Device Schema (simplified for script)
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

const KasuDevice = mongoose.models.KasuDevice || mongoose.model('KasuDevice', kasuDeviceSchema)

async function createTestDevices() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://kasu:kasu@kasu.soalioi.mongodb.net/kasu?appName=kasu')
    console.log('Connected to MongoDB')

    // Create test devices
    const testDevices = [
      {
        macAddress: 'AA:BB:CC:DD:EE:01',
        status: 'assigned',
        phone: '9876543210',
        deviceInfo: {
          model: 'KASU Device v2.1',
          firmware: '2.1.0',
          batteryLevel: 85
        }
      },
      {
        macAddress: 'AA:BB:CC:DD:EE:02',
        status: 'assigned',
        phone: '9876543211',
        deviceInfo: {
          model: 'KASU Device v2.1',
          firmware: '2.1.0',
          batteryLevel: 92
        }
      },
      {
        macAddress: 'AA:BB:CC:DD:EE:03',
        status: 'assigned',
        phone: '9876543212',
        deviceInfo: {
          model: 'KASU Device v2.0',
          firmware: '2.0.5',
          batteryLevel: 67
        }
      },
      {
        macAddress: 'AA:BB:CC:DD:EE:04',
        status: 'unassigned',
        deviceInfo: {
          model: 'KASU Device v2.1',
          firmware: '2.1.0',
          batteryLevel: null
        }
      },
      {
        macAddress: 'AA:BB:CC:DD:EE:05',
        status: 'unassigned',
        deviceInfo: {
          model: 'KASU Device v2.1',
          firmware: '2.1.0',
          batteryLevel: null
        }
      },
      {
        macAddress: 'BB:CC:DD:EE:FF:01',
        status: 'unassigned',
        deviceInfo: {
          model: 'KASU Device v2.2',
          firmware: '2.2.0-beta',
          batteryLevel: null
        }
      }
    ]

    for (const deviceData of testDevices) {
      try {
        const existingDevice = await KasuDevice.findOne({ macAddress: deviceData.macAddress })
        if (existingDevice) {
          console.log(`Device ${deviceData.macAddress} already exists, updating...`)
          await KasuDevice.updateOne({ macAddress: deviceData.macAddress }, deviceData)
        } else {
          const device = new KasuDevice(deviceData)
          await device.save()
          console.log(`Created device: ${deviceData.macAddress} (${deviceData.deviceInfo.model})`)
        }
      } catch (error) {
        console.log(`Error with device ${deviceData.macAddress}:`, error.message)
      }
    }
    
    console.log('\nTest devices created/updated successfully!')
    console.log('You can now:')
    console.log('1. View devices in admin panel at /admin/devices')
    console.log('2. Generate QR codes for unassigned devices')
    console.log('3. Test device connection by scanning QR codes')
    console.log('4. Assign devices to users through admin panel')
    
  } catch (error) {
    console.error('Error creating test devices:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

createTestDevices()