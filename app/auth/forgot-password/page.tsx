'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  PhoneIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Enter phone, 2: Success message
  const [identifier, setIdentifier] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone or email format
    const isEmail = identifier.includes('@')
    const isPhone = /^\d{10}$/.test(identifier)

    if (!isEmail && !isPhone) {
      toast.error('Please enter a valid 10-digit phone number or email address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Password reset instructions sent!')
        setStep(2)
      } else {
        toast.error(data.message || 'Failed to send reset instructions')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/auth/login" className="flex justify-center mb-6">
          <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
        </Link>
        <Link href="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-gradient">KASU</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 1 ? 'Forgot your password?' : 'Check your messages'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 
            ? 'Enter your phone number or email and we\'ll help you reset your password'
            : 'We\'ve sent password reset instructions to you'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  Phone Number or Email
                </label>
                <div className="mt-1 relative">
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Phone number or email address"
                  />
                  <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit phone number or email address
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Instructions Sent!</h3>
              <p className="text-sm text-gray-600 mb-6">
                We've sent password reset instructions to {identifier.includes('@') ? 'your email' : `your phone number ending in ***${identifier.slice(-3)}`}.
                Please check your {identifier.includes('@') ? 'email' : 'messages'} and follow the instructions.
              </p>
              <div className="space-y-3">
                <Link href="/auth/login" className="btn-primary w-full block text-center">
                  Back to Login
                </Link>
                <button
                  onClick={() => {
                    setStep(1)
                    setIdentifier('')
                  }}
                  className="btn-secondary w-full"
                >
                  Try Different {identifier.includes('@') ? 'Email' : 'Number'}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6">
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}