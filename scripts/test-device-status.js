// Test script for device status monitoring
import { monitorDeviceStatus, getDeviceStatus } from '../lib/device-status-monitor.js'

async function testDeviceStatusMonitoring() {
  console.log('🧪 Testing Device Status Monitoring')
  console.log('===================================')
  
  try {
    // Test 1: Run device status monitoring
    console.log('\n1. Running device status monitoring...')
    const monitorResult = await monitorDeviceStatus()
    console.log('Monitor result:', monitorResult)
    
    // Test 2: Get specific device status (replace with actual MAC and phone)
    console.log('\n2. Testing specific device status...')
    const testMacAddress = '6C:C8:40:34:66:CC'
    const testPhone = '9600338406'
    
    const deviceResult = await getDeviceStatus(testMacAddress, testPhone)
    console.log('Device status result:', deviceResult)
    
    // Test 3: Test API endpoint
    console.log('\n3. Testing API endpoint...')
    const response = await fetch(`http://localhost:3000/api/device/status?macAddress=${testMacAddress}&phone=${testPhone}`)
    const apiResult = await response.json()
    console.log('API result:', apiResult)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDeviceStatusMonitoring()