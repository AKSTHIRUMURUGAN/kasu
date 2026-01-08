# Device Connection Status Implementation

## Overview
This implementation provides real-time device connection status tracking based on heartbeat API calls. Devices are marked as "online" when heartbeats are received and "offline" when heartbeats stop for more than 2 minutes.

## Key Features

### 1. **Real-time Connection Status** ✅
- **Online**: Device sending heartbeats within 2 minutes
- **Offline**: No heartbeat for >2 minutes  
- **Connection Quality**: Excellent (<30s), Good (<1min), Fair (<2min)
- **Auto-detection**: Automatic status updates based on heartbeat timing

### 2. **Background Monitoring** ✅
- **Monitor Service**: Runs every 60 seconds
- **Auto-cleanup**: Marks stale devices as offline
- **Long-term tracking**: Identifies devices offline >24 hours
- **Startup integration**: Automatically starts with Next.js app

### 3. **Enhanced Dashboard Display** ✅
- **Real-time status**: Live connection indicators
- **Visual feedback**: Color-coded status dots with animations
- **Detailed info**: Last seen time, connection quality
- **Offline alerts**: Warning messages when device is offline
- **Auto-refresh**: Updates every 30 seconds

### 4. **API Endpoints** ✅
- **`/api/heartbeat`**: Enhanced to update connection status
- **`/api/device/status`**: Get device status by MAC/phone
- **`/api/user/device-status`**: User-specific device status

## Implementation Details

### ESP32 Side (Already Working)
```cpp
// Heartbeat sends device status every 60 seconds
bool sendHeartbeat(const String& profileId) {
    // 1. Sync local transactions to cloud
    syncPendingLocalTransactions(profileId);
    
    // 2. Send heartbeat with device info
    payload["macAddress"] = WiFi.macAddress();
    payload["phone"] = user.phone;
    payload["localBalance"] = user.balance;
    payload["deviceStatus"] = "online";
    
    // 3. Update local balance from cloud response
}
```

### Backend Monitoring
```javascript
// Background service marks devices offline after 2 minutes
export function startDeviceStatusMonitor() {
    setInterval(monitorDeviceStatus, 60000) // Check every minute
}

// API provides real-time status
GET /api/device/status?macAddress=XX:XX:XX&phone=XXXXXXXXXX
```

### Frontend Dashboard
```typescript
// Real-time status display with auto-refresh
const fetchDeviceStatus = async () => {
    const response = await fetch('/api/user/device-status')
    // Updates connection status, quality, last seen time
}

// Refreshes every 30 seconds
setInterval(fetchDeviceStatus, 30000)
```

## Connection Status Logic

### Device States
1. **Default**: `unknown` (no heartbeat received)
2. **First Heartbeat**: `online` (device connects)
3. **Regular Heartbeats**: `online` (every 60 seconds)
4. **Missing Heartbeats**: `offline` (after 2 minutes)

### Status Indicators
- 🟢 **Online (Excellent)**: <30 seconds since last heartbeat
- 🟡 **Online (Good)**: 30s-1min since last heartbeat  
- 🟠 **Online (Fair)**: 1-2min since last heartbeat
- 🔴 **Offline**: >2 minutes since last heartbeat
- ⚪ **Unknown**: No heartbeat data

## Files Modified/Created

### Backend Files
- `kasu/lib/device-status-monitor.js` - Background monitoring service
- `kasu/lib/startup.js` - Service initialization
- `kasu/middleware.ts` - Auto-start services
- `kasu/app/api/device/status/route.ts` - Device status API
- `kasu/app/api/user/device-status/route.ts` - User device status API
- `kasu/app/api/heartbeat/route.ts` - Enhanced heartbeat handling

### Frontend Files
- `kasu/app/dashboard/page.tsx` - Enhanced device status display

### ESP32 Files
- `storage.cpp` - Added `syncPendingLocalTransactions()`
- `storage.h` - Added function declarations
- `main.ino` - Enhanced `sendHeartbeat()` with local sync

## Testing

### Manual Testing
```bash
# Test device status monitoring
node kasu/scripts/test-device-status.js

# Test API endpoints
curl "http://localhost:3000/api/device/status?macAddress=6C:C8:40:34:66:CC&phone=9600338406"
```

### Expected Behavior
1. **Device Online**: Green dot, "Online (excellent)" status
2. **Device Offline**: Red dot, "Offline" status, warning message
3. **Auto-refresh**: Status updates every 30 seconds
4. **Background cleanup**: Offline devices marked automatically

## Benefits

### For Users
- **Real-time visibility** into device connection status
- **Clear indicators** when device is offline
- **Automatic sync** when device comes back online
- **No manual intervention** required

### For System
- **Efficient monitoring** with minimal overhead
- **Automatic cleanup** prevents stale data
- **Scalable architecture** handles multiple devices
- **Reliable sync** ensures data consistency

## Next Steps

1. **Deploy the changes** to your Next.js application
2. **Upload ESP32 code** with enhanced heartbeat sync
3. **Test the connection** status display
4. **Monitor logs** for proper offline detection

The system will now show accurate device connection status based on heartbeat timing, with devices automatically marked offline when heartbeats stop and online when they resume.