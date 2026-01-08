// Test script to simulate ESP32 device sync with local transactions
const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3001'

// Test data
const testDevice = {
  macAddress: 'AA:BB:CC:DD:EE:01',
  phone: '9876543210'
}

// Simulate local transactions
const localTransactions = [
  {
    offlineSyncId: 'tx_offline_001_' + Date.now(),
    type: 'send',
    amount: 5000, // ₹50.00
    description: 'Offline payment to merchant',
    timestamp: Date.now() - 300000, // 5 minutes ago
    status: 'success',
    recipientPhone: '9999999999'
  },
  {
    offlineSyncId: 'tx_offline_002_' + Date.now(),
    type: 'receive',
    amount: 2500, // ₹25.00
    description: 'Received payment offline',
    timestamp: Date.now() - 180000, // 3 minutes ago
    status: 'success',
    recipientPhone: '9876543210'
  },
  {
    offlineSyncId: 'tx_offline_003_' + Date.now(),
    type: 'addMoney',
    amount: 10000, // ₹100.00
    description: 'Added money offline',
    timestamp: Date.now() - 60000, // 1 minute ago
    status: 'success',
    recipientPhone: '9876543210'
  }
]

async function testHeartbeat() {
  try {
    console.log('🧪 Testing ESP32 Device Heartbeat Sync')
    console.log('=====================================')
    console.log(`Device: ${testDevice.macAddress}`)
    console.log(`Phone: ${testDevice.phone}`)
    console.log(`Transactions: ${localTransactions.length}`)
    console.log('')

    const payload = {
      macAddress: testDevice.macAddress,
      phone: testDevice.phone,
      batteryLevel: Math.floor(Math.random() * 100),
      localBalance: 50000, // ₹500.00
      localTransactions: localTransactions
    }

    console.log('📡 Sending heartbeat with payload:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')

    const response = await fetch(`${BASE_URL}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    console.log('📡 Heartbeat Response:')
    console.log('======================')
    console.log(`Status: ${response.status}`)
    console.log(`Success: ${data.success}`)
    
    if (data.success) {
      console.log(`✅ ${data.message}`)
      console.log(`First Connection: ${data.firstConnection}`)
      console.log(`Synced Transactions: ${data.syncedTransactions}`)
      console.log('')
      
      console.log('👤 User Info:')
      console.log(`  Name: ${data.user.name}`)
      console.log(`  Phone: ${data.user.phone}`)
      console.log(`  Balance: ₹${(data.user.balance / 100).toFixed(2)}`)
      console.log(`  Status: ${data.user.status}`)
      console.log('')
      
      console.log('📱 Device Info:')
      console.log(`  MAC: ${data.device.macAddress}`)
      console.log(`  Status: ${data.device.status}`)
      console.log(`  Connection: ${data.device.connectionStatus}`)
      console.log(`  Battery: ${data.device.batteryLevel}%`)
      console.log(`  Local Balance: ₹${(data.device.localBalance / 100).toFixed(2)}`)
      console.log(`  Last Seen: ${new Date(data.device.lastSeen).toLocaleString()}`)
      console.log('')
      
      if (data.syncResults && data.syncResults.length > 0) {
        console.log('📝 Sync Results:')
        data.syncResults.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.offlineSyncId}: ${result.status}`)
          if (result.error) {
            console.log(`     Error: ${result.error}`)
          }
          if (result.cloudId) {
            console.log(`     Cloud ID: ${result.cloudId}`)
          }
        })
        console.log('')
      }
      
      if (data.recentTransactions && data.recentTransactions.length > 0) {
        console.log('💳 Recent Transactions:')
        data.recentTransactions.slice(0, 5).forEach((tx, index) => {
          console.log(`  ${index + 1}. ${tx.type}: ₹${(tx.amount / 100).toFixed(2)} (${tx.status})`)
          console.log(`     From: ${tx.from} → To: ${tx.to}`)
          console.log(`     Time: ${new Date(tx.timestamp).toLocaleString()}`)
        })
      }
      
    } else {
      console.log(`❌ ${data.message}`)
      if (data.error) {
        console.log(`Error: ${data.error}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run multiple heartbeats to test sync
async function runTests() {
  console.log('🚀 Starting Device Sync Tests')
  console.log('==============================\n')
  
  // Test 1: Initial heartbeat with transactions
  await testHeartbeat()
  
  console.log('\n⏳ Waiting 5 seconds...\n')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Test 2: Second heartbeat (should show already synced)
  console.log('🔄 Testing duplicate transaction handling...')
  await testHeartbeat()
  
  console.log('\n✅ All tests completed!')
}

// Run the tests
runTests().catch(console.error)