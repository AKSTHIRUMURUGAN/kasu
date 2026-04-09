'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface ReassignmentRequest {
  _id: string
  userId: {
    _id: string
    name: string
    phone: string
    email: string
  }
  phone: string
  currentDeviceMac?: string
  requestedDeviceMac: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  processedBy?: {
    name: string
  }
  processedAt?: string
  createdAt: string
  currentDevice?: {
    macAddress: string
    status: string
    deviceInfo?: {
      model?: string
    }
  }
  requestedDevice?: {
    macAddress: string
    status: string
    phone?: string
    deviceInfo?: {
      model?: string
    }
  }
}

export default function ReassignmentRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ReassignmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReassignmentRequest | null>(null)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve')
  const [adminNotes, setAdminNotes] = useState('')

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

    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/reassignment-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setRequests(data.requests)
      } else {
        toast.error(data.message || 'Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    setProcessingId(selectedRequest._id)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/reassignment-requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: processAction,
          adminNotes: adminNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Request ${processAction}d successfully`)
        setShowProcessModal(false)
        setSelectedRequest(null)
        setAdminNotes('')
        fetchRequests()
      } else {
        toast.error(data.message || `Failed to ${processAction} request`)
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error('Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  const openProcessModal = (request: ReassignmentRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setProcessAction(action)
    setAdminNotes('')
    setShowProcessModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDeviceStatusColor = (status: string) => {
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
              <span className="ml-4 text-gray-600">Device Reassignment Requests</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {requests.filter(r => r.status === 'pending').length} pending requests
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Requests List */}
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <UserIcon className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.userId.name}
                    </h3>
                    <p className="text-sm text-gray-600">{request.userId.phone}</p>
                    <p className="text-xs text-gray-500">{request.userId.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Current Device */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                    Current Device
                  </h4>
                  {request.currentDevice ? (
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-gray-600">
                        {request.currentDevice.macAddress}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeviceStatusColor(request.currentDevice.status)}`}>
                          {request.currentDevice.status}
                        </span>
                        {request.currentDevice.deviceInfo?.model && (
                          <span className="text-xs text-gray-500">
                            {request.currentDevice.deviceInfo.model}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No current device</p>
                  )}
                </div>

                {/* Requested Device */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                    Requested Device
                  </h4>
                  {request.requestedDevice ? (
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-gray-600">
                        {request.requestedDevice.macAddress}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeviceStatusColor(request.requestedDevice.status)}`}>
                          {request.requestedDevice.status}
                        </span>
                        {request.requestedDevice.deviceInfo?.model && (
                          <span className="text-xs text-gray-500">
                            {request.requestedDevice.deviceInfo.model}
                          </span>
                        )}
                      </div>
                      {request.requestedDevice.phone && request.requestedDevice.phone !== request.phone && (
                        <div className="flex items-center text-amber-600">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          <span className="text-xs">
                            Currently assigned to: {request.requestedDevice.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">Device not found</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Reason for Reassignment</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {request.reason}
                </p>
              </div>

              {/* Admin Notes */}
              {request.adminNotes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {request.adminNotes}
                  </p>
                </div>
              )}

              {/* Processing Info */}
              {request.processedBy && (
                <div className="mb-4 text-sm text-gray-600">
                  Processed by {request.processedBy.name} on{' '}
                  {new Date(request.processedAt!).toLocaleString()}
                </div>
              )}

              {/* Actions */}
              {request.status === 'pending' && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => openProcessModal(request, 'reject')}
                    disabled={processingId === request._id}
                    className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => openProcessModal(request, 'approve')}
                    disabled={processingId === request._id}
                    className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reassignment requests</h3>
            <p className="text-gray-600">All device reassignment requests will appear here.</p>
          </div>
        )}
      </div>

      {/* Process Request Modal */}
      {showProcessModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {processAction === 'approve' ? 'Approve' : 'Reject'} Reassignment Request
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>User:</strong> {selectedRequest.userId.name} ({selectedRequest.userId.phone})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Requested Device:</strong> {selectedRequest.requestedDeviceMac}
                </p>
              </div>

              {processAction === 'approve' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Approving this request will:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                    {selectedRequest.currentDeviceMac && (
                      <li>Deactivate user's current device ({selectedRequest.currentDeviceMac})</li>
                    )}
                    <li>Assign the requested device to this user</li>
                  </ul>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes {processAction === 'reject' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder={`Enter notes for ${processAction}ing this request...`}
                  required={processAction === 'reject'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProcessModal(false)}
                  disabled={processingId === selectedRequest._id}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRequest}
                  disabled={processingId === selectedRequest._id || (processAction === 'reject' && !adminNotes.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                    processAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingId === selectedRequest._id ? 'Processing...' : 
                   processAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}