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

import MobileNavigation from '@/components/MobileNavigation'

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    
    // Initialize background services
    initializeBackgroundServices()
    
    // Fetch initial data
    const initializeData = async () => {
      try {
        await fetchUserData()
        await fetchTransactions()
        await fetchDeviceStatus()
      } catch (error) {
        console.error('Failed to initialize data:', error)
      }
    }
    
    initializeData()

    // Set up periodic device status check (every 15 seconds for more responsive updates)
    const deviceStatusInterval = setInterval(fetchDeviceStatus, 15000)
    
    // Set up live transaction polling (every 5 seconds for near real-time updates)
    const transactionInterval = setInterval(fetchTransactions, 5000)
    
    // Set up user data refresh (every 5 seconds to catch balance updates)
    const userDataInterval = setInterval(fetchUserData, 5000)
    
    return () => {
      clearInterval(deviceStatusInterval)
      clearInterval(transactionInterval)
      clearInterval(userDataInterval)
    }
  }, [router])

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
        // Ensure device object exists and has required properties
        const deviceInfo = data.device || {}
        setDeviceStatus({
          ...deviceInfo,
          timeSinceLastSeenMinutes: deviceInfo.timeSinceLastSeenMinutes || null,
          connectionQuality: deviceInfo.connectionQuality || 'unknown',
          isOnline: deviceInfo.isOnline || false
        })
        setLastSyncTime(new Date().toISOString())
        // Update user device info if available
        if (data.userDeviceInfo && user) {
          setUser(prev => prev ? { ...prev, kasuDevice: data.userDeviceInfo } : null)
        }
      }
    } catch (error) {
      console.error('Error fetching device status:', error)
      // Set safe default values on error
      setDeviceStatus({
        connectionStatus: 'unknown',
        isOnline: false,
        timeSinceLastSeenMinutes: null,
        connectionQuality: 'unknown'
      })
    }
  }

  const refreshAllData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchUserData(),
        fetchTransactions(),
        fetchDeviceStatus()
      ])
      toast.success('Data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')
        router.push('/auth/login')
        return
      }
      
      if (data.success) {
        setUser(data.user)
      } else {
        console.error('Failed to fetch user data:', data.message)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        // Token is invalid, will be handled by fetchUserData
        return
      }
      
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

    if (amount < 1) {
      toast.error('Minimum amount is ₹1')
      return
    }

    setIsProcessingPayment(true)

    try {
      const token = localStorage.getItem('token')
      
      // Create Razorpay order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })

      const orderData = await orderResponse.json()
      
      if (!orderData.success) {
        toast.error(orderData.message || 'Failed to create order')
        setIsProcessingPayment(false)
        return
      }

      // Initialize Razorpay payment
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'KASU',
        description: 'Add money to wallet',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              toast.success('Money added successfully!')
              setShowAddMoney(false)
              setAddAmount('')
              fetchUserData()
              fetchTransactions()
            } else {
              toast.error(verifyData.message || 'Payment verification failed')
            }
          } catch (error) {
            toast.error('Payment verification failed')
          } finally {
            setIsProcessingPayment(false)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false)
            toast.error('Payment cancelled')
          }
        }
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()

    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong')
      setIsProcessingPayment(false)
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
      {/* Mobile Navigation */}
      <MobileNavigation user={user} />

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Status Banner */}
          {user.status !== 'active' && (
            <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-100 text-sm sm:text-base">Total Balance</p>
                    <p className="text-2xl sm:text-3xl font-bold">₹{(user.balance / 100).toFixed(2)}</p>
                  </div>
                  <BanknotesIcon className="w-8 h-8 sm:w-12 sm:h-12 text-primary-200" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 rounded-md hover:bg-white/30 transition-colors text-sm"
                    disabled={user.status !== 'active'}
                  >
                    <PlusIcon className="w-4 h-4 mr-1 sm:mr-2" />
                    Add Money
                  </button>
                  <button
                    onClick={() => setShowSendMoney(true)}
                    className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 rounded-md hover:bg-white/30 transition-colors text-sm"
                    disabled={user.status !== 'active'}
                  >
                    <PaperAirplaneIcon className="w-4 h-4 mr-1 sm:mr-2" />
                    Send Money
                  </button>
                  {(!user.kasuDevice || user.kasuDevice.status === 'unassigned') && (
                    <Link
                      href="/connect-device"
                      className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-yellow-500/20 rounded-md hover:bg-yellow-500/30 transition-colors text-sm"
                    >
                      <DevicePhoneMobileIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      Connect Device
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Device Status - Mobile Responsive */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Device Status</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refreshAllData}
                    disabled={isRefreshing}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh all data"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={fetchDeviceStatus}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Refresh device status"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                  {lastSyncTime && (
                    <span className="text-xs text-gray-500 hidden sm:inline" title={`Last updated: ${new Date(lastSyncTime).toLocaleString()}`}>
                      Updated {getRelativeTime(lastSyncTime)}
                    </span>
                  )}
                </div>
              </div>
              
              {user.kasuDevice ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Device</span>
                    <span className="text-xs sm:text-sm font-medium text-green-600">Assigned</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">MAC Address</span>
                    <span className="text-xs font-mono text-gray-800 truncate max-w-[120px] sm:max-w-none">{user.kasuDevice.macAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Status</span>
                    <span className={`text-xs sm:text-sm font-medium ${
                      user.kasuDevice.status === 'active' ? 'text-green-600' : 
                      user.kasuDevice.status === 'assigned' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {user.kasuDevice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Connection</span>
                    <div className="flex items-center">
                      {deviceStatus?.isOnline ? (
                        <>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            deviceStatus.connectionQuality === 'excellent' ? 'bg-green-500 animate-pulse' :
                            deviceStatus.connectionQuality === 'good' ? 'bg-green-400' :
                            deviceStatus.connectionQuality === 'fair' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className={`text-xs sm:text-sm ${
                            deviceStatus.connectionQuality === 'excellent' ? 'text-green-600' :
                            deviceStatus.connectionQuality === 'good' ? 'text-green-500' :
                            deviceStatus.connectionQuality === 'fair' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            Online
                          </span>
                          {deviceStatus.connectionQuality && (
                            <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                              ({deviceStatus.connectionQuality})
                            </span>
                          )}
                        </>
                      ) : deviceStatus?.connectionStatus === 'offline' ? (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-xs sm:text-sm text-red-600">Offline</span>
                        </>
                      ) : user.kasuDevice.connectionStatus === 'online' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-xs sm:text-sm text-green-600">Online</span>
                        </>
                      ) : user.kasuDevice.connectionStatus === 'offline' ? (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-xs sm:text-sm text-red-600">Offline</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span className="text-xs sm:text-sm text-gray-500">Unknown</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection Status Alert */}
                  {deviceStatus && !deviceStatus.isOnline && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-yellow-800 font-medium">Device Offline</p>
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
                <div className="text-center py-4 sm:py-8">
                  <DevicePhoneMobileIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
                  <p className="text-sm text-gray-500 mb-2">No KASU device assigned</p>
                  <Link
                    href="/connect-device"
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-700"
                  >
                    Connect Device
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions - Mobile Responsive */}
          <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh transactions"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                <span className="hidden sm:inline">Live Updates</span>
                <span className="sm:hidden">Live</span>
              </div>
              <Link href="/transactions" className="text-xs sm:text-sm text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'addMoney' ? 'bg-green-100' :
                        transaction.type === 'send' ? 'bg-red-100' :
                        transaction.type === 'receive' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {transaction.type === 'send' ? (
                          <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        ) : (
                          <ArrowDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            transaction.type === 'addMoney' ? 'text-green-600' : 
                            transaction.type === 'receive' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        )}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.type === 'addMoney' && 'Money Added'}
                            {transaction.type === 'send' && `Sent to ${transaction.to?.phone || 'Unknown'}`}
                            {transaction.type === 'receive' && `Received from ${transaction.from?.phone || 'Unknown'}`}
                          </p>
                          <div className="flex items-center ml-2">
                            <span className={`text-sm font-medium ${
                              transaction.type === 'addMoney' || transaction.type === 'receive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'addMoney' || transaction.type === 'receive' ? '+' : '-'}₹{(transaction.amount / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {getRelativeTime(transaction.timestamp)}
                          </p>
                          <div className={`flex items-center ${getStatusColor(transaction.status)}`}>
                            <div className="w-4 h-4 mr-1">
                              {getStatusIcon(transaction.status)}
                            </div>
                            <span className="text-xs capitalize">{transaction.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-8 text-center">
                <CreditCardIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Add Money Modal - Mobile Responsive */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 sm:top-20 mx-auto border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="p-4 sm:p-5">
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
                    placeholder="Enter amount (min ₹1)"
                    min="1"
                    step="0.01"
                    required
                    disabled={isProcessingPayment}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Secure payment via Razorpay
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessingPayment ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Proceed to Pay'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMoney(false)
                      setAddAmount('')
                    }}
                    disabled={isProcessingPayment}
                    className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Send Money Modal - Mobile Responsive */}
      {showSendMoney && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 sm:top-20 mx-auto border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="p-4 sm:p-5">
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
                    placeholder="Enter 10-digit phone number"
                    pattern="[0-9]{10}"
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
                    max={user ? (user.balance / 100).toString() : "0"}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Send Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSendMoney(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
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