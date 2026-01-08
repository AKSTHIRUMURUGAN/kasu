import { startDeviceStatusMonitor } from './device-status-monitor.js'

let monitorInterval = null

/**
 * Initialize all background services
 */
export function initializeServices() {
  console.log('🚀 Initializing KASU background services...')
  
  // Start device status monitoring
  monitorInterval = startDeviceStatusMonitor()
  
  console.log('✅ All background services initialized')
  
  return {
    monitorInterval
  }
}

/**
 * Cleanup all background services
 */
export function cleanupServices() {
  console.log('🛑 Cleaning up KASU background services...')
  
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
    console.log('✅ Device status monitor stopped')
  }
  
  console.log('✅ All background services cleaned up')
}