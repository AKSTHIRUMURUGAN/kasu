// Script to simulate device heartbeat for testing dashboard device status
const fetch = require('node-fetch')

async function simulateHeartbeat() {
  try {
    console.log('Simulating device heartbeat...')
    
    const response = await fetch('http://localhost:3001/api/device/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        macAddress: 'AA:BB:CC:DD:EE:01', // Test device MAC
        phone: '9876543210', // Test user phone
        batteryLevel: Math.floor(Math.random() * 100), // Random battery level
        localBalance: Math.floor(Math.random() * 100000) // Random local balance
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Heartbeat successful!')
      console.log('Device Status:', data.device.status)
      console.log('Connection Status:', data.device.connectionStatus)
      if (data.firstConnection) {
        console.log('🎉 First connection detected!')
      }
    } else {
      console.log('❌ Heartbeat failed:', data.message)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Send heartbeat every 30 seconds
console.log('Starting device heartbeat simulation...')
console.log('Press Ctrl+C to stop')

simulateHeartbeat()
setInterval(simulateHeartbeat, 30000)