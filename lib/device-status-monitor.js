import { connectDB } from './mongodb.js'
import User, { KasuDevice } from './models.js'

// Device is considered offline if no heartbeat for 2 minutes
const OFFLINE_THRESHOLD = 2 * 60 * 1000 // 2 minutes in milliseconds

/**
 * Background job to monitor device connection status
 * Marks devices as offline if they haven't sent heartbeat within threshold
 */
export async function monitorDeviceStatus() {
  try {
    await connectDB()
    
    const now = new Date()
    const offlineThreshold = new Date(now.getTime() - OFFLINE_THRESHOLD)
    
    console.log(`🔍 Checking device status at ${now.toISOString()}`)
    console.log(`📅 Offline threshold: ${offlineThreshold.toISOString()}`)
    
    // Find users with devices that should be marked offline
    const usersWithStaleDevices = await User.find({
      'kasuDevice.connectionStatus': 'online',
      'kasuDevice.lastSeen': { $lt: offlineThreshold }
    })
    
    let devicesMarkedOffline = 0
    
    for (const user of usersWithStaleDevices) {
      const lastSeen = user.kasuDevice.lastSeen
      const timeSinceLastSeen = now - lastSeen
      const minutesOffline = Math.floor(timeSinceLastSeen / (1000 * 60))
      
      console.log(`📵 Marking device offline: ${user.kasuDevice.macAddress} (${user.phone})`)
      console.log(`   Last seen: ${lastSeen.toISOString()} (${minutesOffline} minutes ago)`)
      
      // Update user device status
      user.kasuDevice.connectionStatus = 'offline'
      await user.save()
      
      // Update device status in KasuDevice collection
      await KasuDevice.updateOne(
        { macAddress: user.kasuDevice.macAddress },
        { 
          status: 'inactive',
          updatedAt: now
        }
      )
      
      devicesMarkedOffline++
    }
    
    if (devicesMarkedOffline > 0) {
      console.log(`📵 Marked ${devicesMarkedOffline} devices as offline`)
    } else {
      console.log(`✅ All devices are within heartbeat threshold`)
    }
    
    // Also check for devices that have been offline for a long time (24 hours)
    const longOfflineThreshold = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    const longOfflineDevices = await User.find({
      'kasuDevice.connectionStatus': 'offline',
      'kasuDevice.lastSeen': { $lt: longOfflineThreshold }
    })
    
    if (longOfflineDevices.length > 0) {
      console.log(`⚠️ Found ${longOfflineDevices.length} devices offline for >24 hours`)
      for (const user of longOfflineDevices) {
        const lastSeen = user.kasuDevice.lastSeen
        const hoursOffline = Math.floor((now - lastSeen) / (1000 * 60 * 60))
        console.log(`   ${user.kasuDevice.macAddress} (${user.phone}): ${hoursOffline} hours offline`)
      }
    }
    
    return {
      success: true,
      devicesChecked: usersWithStaleDevices.length + longOfflineDevices.length,
      devicesMarkedOffline,
      timestamp: now
    }
    
  } catch (error) {
    console.error('❌ Error monitoring device status:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    }
  }
}

/**
 * Get current device status for a specific device
 */
export async function getDeviceStatus(macAddress, phone) {
  try {
    await connectDB()
    
    const user = await User.findOne({ 
      phone,
      'kasuDevice.macAddress': macAddress 
    })
    
    if (!user || !user.kasuDevice) {
      return {
        success: false,
        message: 'Device not found',
        status: 'unknown'
      }
    }
    
    const now = new Date()
    const lastSeen = user.kasuDevice.lastSeen
    const timeSinceLastSeen = lastSeen ? now - lastSeen : null
    const isOnline = timeSinceLastSeen && timeSinceLastSeen < OFFLINE_THRESHOLD
    
    // Auto-update status if needed
    if (user.kasuDevice.connectionStatus === 'online' && !isOnline) {
      user.kasuDevice.connectionStatus = 'offline'
      await user.save()
    }
    
    return {
      success: true,
      device: {
        macAddress: user.kasuDevice.macAddress,
        phone: user.phone,
        connectionStatus: user.kasuDevice.connectionStatus,
        lastSeen: user.kasuDevice.lastSeen,
        timeSinceLastSeen: timeSinceLastSeen ? Math.floor(timeSinceLastSeen / 1000) : null,
        isOnline: isOnline
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting device status:', error)
    return {
      success: false,
      error: error.message,
      status: 'unknown'
    }
  }
}

/**
 * Start the device status monitoring service
 * Runs every minute to check for offline devices
 */
export function startDeviceStatusMonitor() {
  console.log('🚀 Starting device status monitor...')
  
  // Run immediately
  monitorDeviceStatus()
  
  // Then run every minute
  const interval = setInterval(monitorDeviceStatus, 60 * 1000) // 1 minute
  
  console.log('✅ Device status monitor started (checking every 60 seconds)')
  
  return interval
}

/**
 * Stop the device status monitoring service
 */
export function stopDeviceStatusMonitor(interval) {
  if (interval) {
    clearInterval(interval)
    console.log('🛑 Device status monitor stopped')
  }
}