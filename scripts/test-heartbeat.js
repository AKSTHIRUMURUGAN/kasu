// Test script to simulate device heartbeat
async function testHeartbeat() {
  try {
    const response = await fetch('http://localhost:3000/api/device/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        macAddress: 'AA:BB:CC:DD:EE:01',
        phone: '9876543210',
        batteryLevel: 85,
        localBalance: 50000
      })
    })

    const data = await response.json()
    console.log('Heartbeat response:', data)
    
    if (data.success) {
      console.log('✅ Device heartbeat successful!')
      if (data.firstConnection) {
        console.log('🎉 This was the first connection for this device!')
      }
    } else {
      console.log('❌ Heartbeat failed:', data.message)
    }
  } catch (error) {
    console.error('Error sending heartbeat:', error.message)
  }
}

// Run the test
testHeartbeat()