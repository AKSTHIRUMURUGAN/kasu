'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PencilIcon,
  ArrowLeftIcon,
  DevicePhoneMobileIcon,
  HeartIcon,
  ExclamationTriangleIcon
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
  status: string
  kasuDevice?: {
    macAddress: string
    status: string
  }
  medicalInfo?: {
    bloodGroup?: string
    allergies?: string[]
    emergencyContact?: string
  }
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bloodGroup: '',
    allergies: '',
    emergencyContact: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
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
        setFormData({
          name: data.user.name,
          email: data.user.email,
          bloodGroup: data.user.medicalInfo?.bloodGroup || '',
          allergies: data.user.medicalInfo?.allergies?.join(', ') || '',
          emergencyContact: data.user.medicalInfo?.emergencyContact || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          medicalInfo: {
            bloodGroup: formData.bloodGroup,
            allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a),
            emergencyContact: formData.emergencyContact
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Profile updated successfully!')
        setEditing(false)
        fetchUserProfile()
      } else {
        toast.error(data.message || 'Failed to update profile')
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
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
              <Link href="/dashboard" className="mr-2">
                <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="KASU Logo" className="h-8 w-auto" />
                <img src="/name.png" alt="KASU" className="h-6 w-auto" />
              </div>
              <span className="ml-4 text-gray-600">Profile</span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center text-primary-600 hover:text-primary-700"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-4">{user.phone}</p>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(user.status)}`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-3xl font-bold text-primary-600">₹{(user.balance / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">Full Name</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                      <p className="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Documents */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Identity Documents</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <IdentificationIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.aadhar}</p>
                    <p className="text-sm text-gray-500">Aadhaar Number</p>
                  </div>
                </div>
                {user.pan && (
                  <div className="flex items-center">
                    <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.pan}</p>
                      <p className="text-sm text-gray-500">PAN Number</p>
                    </div>
                  </div>
                )}
                {user.drivingLicense && (
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.drivingLicense}</p>
                      <p className="text-sm text-gray-500">Driving License</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Medical Information</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Emergency contact number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies (comma separated)
                    </label>
                    <input
                      type="text"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., Peanuts, Shellfish, Penicillin"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.medicalInfo?.bloodGroup && (
                    <div className="flex items-center">
                      <HeartIcon className="w-5 h-5 text-red-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.medicalInfo.bloodGroup}</p>
                        <p className="text-sm text-gray-500">Blood Group</p>
                      </div>
                    </div>
                  )}
                  {user.medicalInfo?.emergencyContact && (
                    <div className="flex items-center">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.medicalInfo.emergencyContact}</p>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                      </div>
                    </div>
                  )}
                  {user.medicalInfo?.allergies && user.medicalInfo.allergies.length > 0 && (
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.medicalInfo.allergies.join(', ')}</p>
                        <p className="text-sm text-gray-500">Known Allergies</p>
                      </div>
                    </div>
                  )}
                  {(!user.medicalInfo?.bloodGroup && !user.medicalInfo?.emergencyContact && (!user.medicalInfo?.allergies || user.medicalInfo.allergies.length === 0)) && (
                    <p className="text-sm text-gray-500 italic">No medical information provided</p>
                  )}
                </div>
              )}
            </div>

            {/* Device Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">KASU Device</h3>
              {user.kasuDevice ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Device Assigned</p>
                      <p className="text-sm text-gray-500">MAC: {user.kasuDevice.macAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${user.kasuDevice.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.kasuDevice.status === 'active' ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-sm text-gray-500">Device Status</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DevicePhoneMobileIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No KASU device assigned</p>
                  <p className="text-sm text-gray-400 mt-2">Contact admin for device assignment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}