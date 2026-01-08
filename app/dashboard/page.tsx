'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  BanknotesIcon,
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface User {
  _id: string
  name: string
  phone: string
  email: string
  balance: number
  status: string
  kasuDevice?: {
    macAddress: string
    status: string
    connectionStatus: string
    lastSeen: string
    assignedAt: string
  }
}

interface Transaction {
  _id: string
  type: string
  amount: number
  status: string
  timestamp: string
  from?: { phone: string }
  to?: { phone: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceStatus, setDeviceStatus] = useState<any>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showSendMoney, setShowSendMoney] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    
    // Initialize background services
    initializeBackgroundServices()
    
    fetchUserData()
    fetchTransactions()
    fetchDeviceStatus()

    // Set up periodic device status check (every 30 seconds)
    const deviceStatusInterval = setInterval(fetchDeviceStatus, 30000)
    
    // Set up live transaction polling (every 10 seconds)
    const transactionInterval = setInterval(fetchTransactions, 10000)
    
    return () => {
      clearInterval(deviceStatusInterval)
      clearInterval(transactionInterval)
    }
  }, [])

  const initializeBackgroundServices = async () => {
    try {
      const response = await fetch('/api/system/init')
      const data = await response.json()
      if (data.success) {
        console.log('✅ Background services initialized')
      }
    } catch (error) {
      console.error('❌ Failed to initialize background services:', error)
    }
  }

  const fetchDeviceStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/device-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setDeviceStatus(data.device)
        setLastSyncTime(new Date().toISOString())
        // Update user device info if available
        if (data.userDeviceInfo && user) {
          setUser(prev => prev ? { ...prev, kasuDevice: data.userDeviceInfo } : null)
        }
      }
    } catch (error) {
      console.error('Error fetching device status:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(addAmount)
    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transaction/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Money added successfully!')
        setShowAddMoney(false)
        setAddAmount('')
        fetchUserData()
        fetchTransactions()
      } else {
        toast.error(data.message || 'Failed to add money')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(sendAmount)
    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (recipientPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    if (!user || user.balance < amount * 100) { // Convert to paise
      toast.error('Insufficient balance')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount,
          recipientPhone
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Money sent successfully!')
        setShowSendMoney(false)
        setSendAmount('')
        setRecipientPhone('')
        fetchUserData()
        fetchTransactions()
      } else {
        toast.error(data.message || 'Failed to send money')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-5 h-5" />
      case 'pending': return <ClockIcon className="w-5 h-5" />
      case 'failed': return <XCircleIcon className="w-5 h-5" />
      default: return <ClockIcon className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
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
              <h1 className="text-2xl font-bold text-gradient">KASU</h1>
              <span className="ml-4 text-gray-600">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </Link>
              <Link href="/profile" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <UserIcon className="w-5 h-5" />
                <span className="text-sm">{user.name}</span>
              </Link>
              <Link href="/transactions" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <DocumentTextIcon className="w-5 h-5" />
                <span className="text-sm">Transactions</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </Link>
              <Link href="/help" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <QuestionMarkCircleIcon className="w-5 h-5" />
                <span className="text-sm">Help</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {user.status !== 'active' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Status: {user.status}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {user.status === 'pending' && 'Your account is pending admin approval. You will be notified once approved.'}
                  {user.status === 'verified' && 'Your account is verified but device assignment is pending.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100">Total Balance</p>
                  <p className="text-3xl font-bold">₹{(user.balance / 100).toFixed(2)}</p>
                </div>
                <BanknotesIcon className="w-12 h-12 text-primary-200" />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="flex items-center px-4 py-2 bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                  disabled={user.status !== 'active'}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Money
                </button>
                <button
                  onClick={() => setShowSendMoney(true)}
                  className="flex items-center px-4 py-2 bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                  disabled={user.status !== 'active'}
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Send Money
                </button>
                {(!user.kasuDevice || user.kasuDevice.status === 'unassigned') && (
                  <Link
                    href="/connect-device"
                    className="flex items-center px-4 py-2 bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                    Connect Device
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Device Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Device Status</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchDeviceStatus}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Refresh device status"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
                <DevicePhoneMobileIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            {user.kasuDevice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Device</span>
                  <span className="text-sm font-medium text-green-600">Assigned</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">MAC Address</span>
                  <span className="text-xs font-mono text-gray-800">{user.kasuDevice.macAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${
                    user.kasuDevice.status === 'active' ? 'text-green-600' : 
                    user.kasuDevice.status === 'assigned' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {user.kasuDevice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <div className="flex items-center">
                    {deviceStatus?.isOnline ? (
                      <>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          deviceStatus.connectionQuality === 'excellent' ? 'bg-green-500 animate-pulse' :
                          deviceStatus.connectionQuality === 'good' ? 'bg-green-400' :
                          deviceStatus.connectionQuality === 'fair' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className={`text-sm ${
                          deviceStatus.connectionQuality === 'excellent' ? 'text-green-600' :
                          deviceStatus.connectionQuality === 'good' ? 'text-green-500' :
                          deviceStatus.connectionQuality === 'fair' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          Online
                        </span>
                        {deviceStatus.connectionQuality && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({deviceStatus.connectionQuality})
                          </span>
                        )}
                      </>
                    ) : deviceStatus?.connectionStatus === 'offline' ? (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-red-600">Offline</span>
                      </>
                    ) : user.kasuDevice.connectionStatus === 'online' ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-green-600">Online</span>
                      </>
                    ) : user.kasuDevice.connectionStatus === 'offline' ? (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-red-600">Offline</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-500">Unknown</span>
                      </>
                    )}
                  </div>
                </div>
                {deviceStatus?.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Synced</span>
                    <span className="text-xs text-gray-500" title={new Date(deviceStatus.lastSync).toLocaleString()}>
                      {getRelativeTime(deviceStatus.lastSync)}
                    </span>
                  </div>
                )}
                {(deviceStatus?.lastSeenFormatted || user.kasuDevice.lastSeen) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Seen</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-700">
                        {deviceStatus?.lastSeenFormatted || new Date(user.kasuDevice.lastSeen).toLocaleString()}
                      </span>
                      {deviceStatus?.timeSinceLastSeenMinutes !== null && (
                        <div className="text-xs text-gray-500">
                          {deviceStatus.timeSinceLastSeenMinutes === 0 ? 'Just now' : 
                           deviceStatus.timeSinceLastSeenMinutes === 1 ? '1 minute ago' :
                           `${deviceStatus.timeSinceLastSeenMinutes} minutes ago`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {user.kasuDevice.assignedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Connected</span>
                    <span className="text-xs text-gray-500">
                      {new Date(user.kasuDevice.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {deviceStatus?.deviceInfo?.batteryLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Battery</span>
                    <div className="flex items-center">
                      <div className="w-6 h-3 bg-gray-200 rounded-sm mr-2">
                        <div 
                          className={`h-full rounded-sm ${
                            deviceStatus.deviceInfo.batteryLevel > 50 ? 'bg-green-500' :
                            deviceStatus.deviceInfo.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${deviceStatus.deviceInfo.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{deviceStatus.deviceInfo.batteryLevel}%</span>
                    </div>
                  </div>
                )}
                {deviceStatus?.localBalance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Local Balance</span>
                    <span className="text-xs text-gray-700">₹{(deviceStatus.localBalance / 100).toFixed(2)}</span>
                  </div>
                )}
                {lastSyncTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dashboard Sync</span>
                    <span className="text-xs text-gray-500" title={new Date(lastSyncTime).toLocaleString()}>
                      {getRelativeTime(lastSyncTime)}
                    </span>
                  </div>
                )}
                
                {/* Connection Status Alert */}
                {deviceStatus && !deviceStatus.isOnline && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-800 font-medium">Device Offline</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Transactions will be stored locally and synced when connection is restored.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href="/connect-device"
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Manage Device Connection
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <SignalIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No device assigned</p>
                <Link
                  href="/connect-device"
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100"
                >
                  <DevicePhoneMobileIcon className="w-3 h-3 mr-1" />
                  Connect Device
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Updates
              </div>
              <Link href="/transactions" className="text-sm text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${transaction.type === 'send' ? 'bg-red-100' : 'bg-green-100'}`}>
                      {transaction.type === 'send' ? (
                        <ArrowUpIcon className={`w-4 h-4 ${transaction.type === 'send' ? 'text-red-600' : 'text-green-600'}`} />
                      ) : (
                        <ArrowDownIcon className={`w-4 h-4 ${transaction.type === 'send' ? 'text-red-600' : 'text-green-600'}`} />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.type === 'addMoney' && 'Money Added'}
                        {transaction.type === 'send' && `Sent to ${transaction.to?.phone}`}
                        {transaction.type === 'receive' && `Received from ${transaction.from?.phone}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${transaction.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.type === 'send' ? '-' : '+'}₹{(transaction.amount / 100).toFixed(2)}
                    </span>
                    <div className={`ml-2 ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Money</h3>
              <form onSubmit={handleAddMoney}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMoney(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Add Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Send Money Modal */}
      {showSendMoney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Money</h3>
              <form onSubmit={handleSendMoney}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Phone Number
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="10-digit phone number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    max={(user.balance / 100).toString()}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSendMoney(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Send Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}