'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import QRCode from 'react-qr-code'
import { downloadQRCode } from '@/lib/qr-utils'
import { 
  DevicePhoneMobileIcon,
  QrCodeIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Device {
  _id: string
  macAddress: string
  deviceInfo: {
    model?: string
    firmware?: string
    batteryLevel?: number
  }
  status: 'unassigned' | 'assigned' | 'active' | 'inactive' | 'deactivated'
  assignedUser?: {
    name: string
    phone: string
  }
  createdAt: string
}

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [newDevice, setNewDevice] = useState({
    macAddress: '',
    model: '',
    firmware: ''
  })

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        toast.error('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }
    } catch (error) {
      toast.error('Invalid token. Please login again.')
      router.push('/auth/login')
      return
    }

    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setDevices(data.devices)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDevice.macAddress) {
      toast.error('MAC address is required')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          macAddress: newDevice.macAddress,
          deviceInfo: {
            model: newDevice.model || 'KASU Device',
            firmware: newDevice.firmware || '1.0.0'
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Device added successfully')
        setShowAddDevice(false)
        setNewDevice({ macAddress: '', model: '', firmware: '' })
        fetchDevices()
      } else {
        toast.error(data.message || 'Failed to add device')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Device deleted successfully')
        fetchDevices()
      } else {
        toast.error(data.message || 'Failed to delete device')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleDeactivateDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this device? The user will lose access to it.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/update-device-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: deviceId,
          status: 'deactivated'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Device deactivated successfully')
        fetchDevices()
      } else {
        toast.error(data.message || 'Failed to deactivate device')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const generateQRData = (macAddress: string) => {
    return JSON.stringify({
      type: 'KASU_DEVICE',
      macAddress: macAddress,
      timestamp: Date.now()
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadQRFromModal = async () => {
    if (!selectedDevice) return
    
    try {
      const qrData = generateQRData(selectedDevice.macAddress)
      const filename = `KASU_Device_${selectedDevice.macAddress.replace(/:/g, '_')}_QR.png`
      
      await downloadQRCode(qrData, filename)
      toast.success('QR code downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download QR code. Please try again.')
    }
  }

  const downloadQR = async (macAddress: string) => {
    try {
      const qrData = generateQRData(macAddress)
      const filename = `KASU_Device_${macAddress.replace(/:/g, '_')}_QR.png`
      
      await downloadQRCode(qrData, filename)
      toast.success('QR code downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download QR code. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'unassigned': return 'text-gray-600 bg-gray-100'
      case 'inactive': return 'text-red-600 bg-red-100'
      case 'deactivated': return 'text-red-800 bg-red-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
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
            <div className="flex items-center gap-2">
              <Link href="/admin" className="mr-2">
                <ArrowLeftIcon className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <img src="/logo.png" alt="KASU Logo" className="h-8 w-auto" />
              <img src="/name.png" alt="KASU" className="h-6 w-auto" />
              <span className="ml-4 text-gray-600">Device Management</span>
            </div>
            <button
              onClick={() => setShowAddDevice(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div key={device._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DevicePhoneMobileIcon className="w-8 h-8 text-primary-600" />
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">MAC Address</p>
                  <p className="text-sm text-gray-600 font-mono">{device.macAddress}</p>
                </div>
                
                {device.deviceInfo?.model && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Model</p>
                    <p className="text-sm text-gray-600">{device.deviceInfo.model}</p>
                  </div>
                )}
                
                {device.assignedUser && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned To</p>
                    <p className="text-sm text-gray-600">{device.assignedUser.name}</p>
                    <p className="text-xs text-gray-500">{device.assignedUser.phone}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDevice(device)
                        setShowQRModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Show QR Code"
                    >
                      <QrCodeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => downloadQR(device.macAddress)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Download QR Code"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(device.macAddress)}
                      className="text-green-600 hover:text-green-900"
                      title="Copy MAC Address"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    {device.status === 'assigned' && (
                      <button
                        onClick={() => handleDeactivateDevice(device._id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Deactivate Device"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    {(device.status === 'unassigned' || device.status === 'deactivated') && (
                      <button
                        onClick={() => handleDeleteDevice(device._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Device"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12">
            <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first KASU device.</p>
            <button
              onClick={() => setShowAddDevice(true)}
              className="btn-primary"
            >
              Add Device
            </button>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Device</h3>
              <form onSubmit={handleAddDevice}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MAC Address *
                    </label>
                    <input
                      type="text"
                      value={newDevice.macAddress}
                      onChange={(e) => setNewDevice({...newDevice, macAddress: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono"
                      placeholder="AA:BB:CC:DD:EE:FF"
                      pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Model
                    </label>
                    <input
                      type="text"
                      value={newDevice.model}
                      onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="KASU Device v2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firmware Version
                    </label>
                    <input
                      type="text"
                      value={newDevice.firmware}
                      onChange={(e) => setNewDevice({...newDevice, firmware: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1.0.0"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddDevice(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Add Device
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedDevice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device QR Code</h3>
              
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4" id="qr-code-display">
                <QRCode
                  value={generateQRData(selectedDevice.macAddress)}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              
              <div className="text-left space-y-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">MAC Address:</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedDevice.macAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Status:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDevice.status)}`}>
                    {selectedDevice.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={downloadQRFromModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Download QR
                </button>
                <button
                  onClick={() => copyToClipboard(generateQRData(selectedDevice.macAddress))}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Copy QR Data
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}