'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  UserGroupIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CogIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

interface User {
  _id: string
  name: string
  phone: string
  email: string
  aadhar: string
  pan?: string
  drivingLicense?: string
  balance: number
  status: 'pending' | 'verified' | 'active' | 'blocked'
  role?: string
  kasuDevice?: {
    macAddress: string
    status: string
    connectionStatus?: string
    lastSeen?: string
  }
  createdAt: string
}

interface Stats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  totalBalance: number
  totalTransactions: number
  activeDevices: number
  assignedDevices: number
  onlineDevices: number
  unassignedDevices: number
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    activeDevices: 0,
    assignedDevices: 0,
    onlineDevices: 0,
    unassignedDevices: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showAssignDevice, setShowAssignDevice] = useState(false)
  const [deviceMac, setDeviceMac] = useState('')

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Decode token to check role
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

    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`User status updated to ${newStatus}`)
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleAssignDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !deviceMac) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/assign-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: selectedUser._id, 
          macAddress: deviceMac 
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Device assigned successfully')
        setShowAssignDevice(false)
        setDeviceMac('')
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to assign device')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const updateDeviceStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/update-device-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Updated ${data.updatedCount} device statuses`)
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to update device status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const simulateDeviceStatuses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/simulate-devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Updated ${data.updatedCount} device statuses`)
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to simulate devices')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'verified': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'blocked': return 'text-red-600 bg-red-100'
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">KASU</h1>
              <span className="ml-4 text-gray-600">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/devices"
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                Manage Devices
              </Link>
              <button
                onClick={updateDeviceStatus}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Update Status
              </button>
              <button
                onClick={simulateDeviceStatuses}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Simulate Devices
              </button>
              <CogIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BanknotesIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">₹{(stats.totalBalance / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="w-8 h-8 text-teal-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assignedDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Online Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.onlineDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDevices || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unassigned Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unassignedDevices || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(user.balance / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.kasuDevice?.macAddress ? (
                        <div className="text-sm">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              user.kasuDevice.status === 'unassigned' ? 'bg-gray-400' :
                              user.kasuDevice.connectionStatus === 'online' ? 'bg-green-500' :
                              user.kasuDevice.connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-gray-900 font-medium">
                              {user.kasuDevice.status === 'unassigned' ? 'Unassigned' : 'Assigned'}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {user.kasuDevice.status === 'unassigned' ? 'No Status' :
                             user.kasuDevice.connectionStatus === 'online' ? 'Connected' :
                             user.kasuDevice.connectionStatus === 'offline' ? 'Not Connected' : 'Not Connected'}
                          </div>
                          <div className="text-gray-400 text-xs">
                            MAC: {user.kasuDevice.macAddress.slice(-6)}
                          </div>
                          {user.kasuDevice.lastSeen && user.kasuDevice.connectionStatus !== 'online' && (
                            <div className="text-gray-400 text-xs">
                              Last seen: {new Date(user.kasuDevice.lastSeen).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2 bg-gray-300"></div>
                            <span className="text-gray-500">Not Assigned</span>
                          </div>
                          <div className="text-gray-400 text-xs mt-1">No Device</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(user._id, 'verified')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(user._id, 'blocked')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user.status === 'verified' && !user.kasuDevice && (
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowAssignDevice(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <DevicePhoneMobileIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.phone}</p>
                    <p className="text-sm text-gray-500">Phone Number</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <IdentificationIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.aadhar}</p>
                    <p className="text-sm text-gray-500">Aadhaar Number</p>
                  </div>
                </div>
                {selectedUser.pan && (
                  <div className="flex items-center">
                    <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.pan}</p>
                      <p className="text-sm text-gray-500">PAN Number</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <BanknotesIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">₹{(selectedUser.balance / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Current Balance</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Device Modal */}
      {showAssignDevice && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Device</h3>
              <p className="text-sm text-gray-600 mb-4">
                Assigning device to: <strong>{selectedUser.name}</strong>
              </p>
              <form onSubmit={handleAssignDevice}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device MAC Address
                  </label>
                  <input
                    type="text"
                    value={deviceMac}
                    onChange={(e) => setDeviceMac(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter MAC address"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignDevice(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Assign Device
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