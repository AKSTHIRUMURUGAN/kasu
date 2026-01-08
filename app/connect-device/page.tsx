'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scanner } from '@yudiel/react-qr-scanner'
import toast from 'react-hot-toast'
import { 
  QrCodeIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ScannedDevice {
  type: string
  macAddress: string
  timestamp: number
}

export default function ConnectDevicePage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualMacAddress, setManualMacAddress] = useState('')
  const [scannedData, setScannedData] = useState<ScannedDevice | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get user info from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserInfo(payload)
    } catch (error) {
      toast.error('Invalid token. Please login again.')
      router.push('/auth/login')
    }
  }, [])

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue
      
      try {
        const data = JSON.parse(result)
        
        if (data.type === 'KASU_DEVICE' && data.macAddress) {
          setScannedData(data)
          setIsScanning(false)
          toast.success('Device QR code scanned successfully!')
        } else {
          toast.error('Invalid QR code. Please scan a KASU device QR code.')
        }
      } catch (error) {
        toast.error('Invalid QR code format')
      }
    }
  }

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error)
    setError('Camera access failed. Please check permissions.')
  }

  const connectDevice = async () => {
    if (!scannedData || !userInfo) return

    setConnecting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/device/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          macAddress: scannedData.macAddress,
          phone: userInfo.phone
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setConnected(true)
        toast.success('Device connected successfully!')
        
        // Send initial heartbeat
        setTimeout(() => {
          sendHeartbeat(scannedData.macAddress, userInfo.phone)
        }, 1000)
      } else {
        setError(data.message || 'Failed to connect device')
        toast.error(data.message || 'Failed to connect device')
      }
    } catch (error) {
      setError('Connection failed. Please try again.')
      toast.error('Connection failed. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const sendHeartbeat = async (macAddress: string, phone: string) => {
    try {
      const response = await fetch('/api/device/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          macAddress,
          phone,
          batteryLevel: 100, // Simulated
          localBalance: 0
        })
      })

      const data = await response.json()
      if (data.success && data.firstConnection) {
        toast.success('Device is now online!')
      }
    } catch (error) {
      console.error('Heartbeat failed:', error)
    }
  }

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    if (!macRegex.test(manualMacAddress)) {
      toast.error('Invalid MAC address format. Use format: AA:BB:CC:DD:EE:FF')
      return
    }

    // Create scanned data object
    const data: ScannedDevice = {
      type: 'KASU_DEVICE',
      macAddress: manualMacAddress.toUpperCase(),
      timestamp: Date.now()
    }

    setScannedData(data)
    setShowManualEntry(false)
    toast.success('MAC address entered successfully!')
  }

  const resetScanner = () => {
    setScannedData(null)
    setConnected(false)
    setError(null)
    setIsScanning(false)
    setShowManualEntry(false)
    setManualMacAddress('')
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-2xl font-bold text-gradient">KASU</h1>
              <span className="ml-4 text-gray-600">Connect Device</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isScanning && !showManualEntry && !scannedData && !connected && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <QrCodeIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your KASU Device</h2>
              <p className="text-gray-600 mb-6">
                Scan the QR code on your KASU device or enter the MAC address manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setIsScanning(true)}
                  className="btn-primary flex items-center mx-auto"
                >
                  <CameraIcon className="w-5 h-5 mr-2" />
                  Start Scanning
                </button>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="btn-secondary flex items-center mx-auto"
                >
                  <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
                  Enter MAC Manually
                </button>
              </div>
            </div>
          </div>
        )}

        {showManualEntry && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <DevicePhoneMobileIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enter MAC Address</h3>
              <p className="text-sm text-gray-600">Enter your KASU device MAC address manually</p>
            </div>
            
            <form onSubmit={handleManualEntry} className="space-y-4">
              <div>
                <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  MAC Address
                </label>
                <input
                  type="text"
                  id="macAddress"
                  value={manualMacAddress}
                  onChange={(e) => setManualMacAddress(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: AA:BB:CC:DD:EE:FF (found on your device label)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Connect Device
                </button>
              </div>
            </form>
          </div>
        )}

        {isScanning && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Device QR Code</h3>
              <p className="text-sm text-gray-600">Point your camera at the QR code on your KASU device</p>
            </div>
            
            <div className="relative">
              <Scanner
                onScan={handleScan}
                onError={handleError}
              />
              
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsScanning(false)
                  setShowManualEntry(true)
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Can't scan? Enter MAC address manually
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {scannedData && !connected && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <DevicePhoneMobileIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Detected</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-left space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">MAC Address:</span>
                    <span className="text-sm text-gray-900 font-mono ml-2">{scannedData.macAddress}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">User:</span>
                    <span className="text-sm text-gray-900 ml-2">{userInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Scanned:</span>
                    <span className="text-sm text-gray-900 ml-2">
                      {new Date(scannedData.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetScanner}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Try Again
                </button>
                <button
                  onClick={connectDevice}
                  disabled={connecting}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? 'Connecting...' : 'Connect Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {connected && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Connected Successfully!</h3>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Your KASU device is now connected and ready to use. You can start making transactions.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetScanner}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Connect Another Device
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}