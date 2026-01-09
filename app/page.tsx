'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CreditCardIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  UserGroupIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  BanknotesIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: WifiIcon,
    title: 'Offline-First Payments',
    description: 'Works without internet connectivity. Perfect for rural areas and network-challenged regions.',
    color: 'text-blue-600'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Biometric Security',
    description: 'Dual fingerprint authentication ensures only authorized users can transact.',
    color: 'text-green-600'
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'NFC Technology',
    description: 'Tap-to-pay using NFC cards and devices. Simple, fast, and secure transactions.',
    color: 'text-purple-600'
  },
  {
    icon: UserGroupIcon,
    title: 'Universal Access',
    description: 'Voice interface and accessibility features for visually impaired and elderly users.',
    color: 'text-orange-600'
  },
  {
    icon: CreditCardIcon,
    title: 'Multi-Function Card',
    description: 'One card for payments, identity verification, and medical records storage.',
    color: 'text-indigo-600'
  },
  {
    icon: GlobeAltIcon,
    title: 'Cloud Sync',
    description: 'Automatic synchronization with cloud when internet is available.',
    color: 'text-teal-600'
  }
]

const stats = [
  { label: 'Rural Population Served', value: '900M+', icon: UserGroupIcon },
  { label: 'Unbanked Adults Targeted', value: '190M+', icon: BanknotesIcon },
  { label: 'Small Merchants', value: '12M+', icon: ChartBarIcon },
  { label: 'Transaction Success Rate', value: '99.9%', icon: CheckCircleIcon }
]

const testimonials = [
  {
    name: 'Lakshmi Devi',
    role: 'Kirana Shop Owner, Tamil Nadu',
    content: 'KASU changed my business. Now I can accept digital payments even when network is poor. Very safe and easy to use.',
    rating: 5
  },
  {
    name: 'Rajesh Kumar',
    role: 'Farmer, Uttar Pradesh',
    content: 'Voice guidance helps me use KASU easily. No need to read or write. Just speak and tap the card.',
    rating: 5
  },
  {
    name: 'Dr. Priya Sharma',
    role: 'Rural Health Center',
    content: 'Emergency medical data on KASU cards saves lives. Instant access to patient history during emergencies.',
    rating: 5
  }
]

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gradient">KASU</h1>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#revolution" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                  Revolution
                </a>
                <a href="#features" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#about" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                  About
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                  Testimonials
                </a>
                <Link href="/auth/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a href="#revolution" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Revolution
            </a>
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Features
            </a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              About
            </a>
            <a href="#testimonials" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Testimonials
            </a>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <Link href="/auth/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Login
              </Link>
              <Link href="/auth/register" className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 mt-2">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 sm:pb-20 hero-gradient text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh] sm:min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                The Future of
                <span className="block text-yellow-300">Digital Payments</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100">
                Secure, offline-first payment system that works everywhere. 
                Bringing financial inclusion to 900M+ rural Indians.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3">
                  Start Your Journey
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
                </Link>
                <button className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 text-base sm:text-lg px-6 sm:px-8 py-3">
                  <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                  Watch Demo
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200 text-sm sm:text-base">Balance</span>
                      <span className="text-xl sm:text-2xl font-bold">₹12,450</span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm sm:text-base">Last Transaction</span>
                        <span className="text-green-300 text-sm sm:text-base">+₹500</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm sm:text-base">Status</span>
                        <span className="text-green-300 flex items-center text-sm sm:text-base">
                          <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-48 h-48 sm:w-72 sm:h-72 bg-yellow-300/20 rounded-full blur-3xl animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Revolution of Money Section */}
      <section id="revolution" className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                The Revolution of Money
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                From barter to blockchain - witness the evolution that led to KASU, the next revolution in financial transactions
              </p>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary-200 via-primary-400 to-primary-600 hidden lg:block"></div>
            
            {/* Timeline Items */}
            <div className="space-y-12 lg:space-y-16">
              {/* Barter Era */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col lg:flex-row items-center"
              >
                <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-8 border border-orange-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        1
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 ml-4">Barter Era</h3>
                    </div>
                    <h4 className="text-lg font-semibold text-orange-700 mb-2">"Pandaparimaatru Murai"</h4>
                    <p className="text-gray-700">
                      Direct exchange of goods and services. Simple but limited by the need for mutual wants and difficulty in storing value.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-4 border-white shadow-lg"></div>
                <div className="lg:w-1/2 lg:pl-12">
                  <div className="text-center lg:text-left">
                    <div className="text-6xl mb-4">🤝</div>
                    <p className="text-gray-600 italic">"I'll give you rice for your cloth"</p>
                  </div>
                </div>
              </motion.div>

              {/* Metal Coins Era */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col lg:flex-row-reverse items-center"
              >
                <div className="lg:w-1/2 lg:pl-12 mb-8 lg:mb-0">
                  <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-8 border border-yellow-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        2
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 ml-4">Metal Coins</h3>
                    </div>
                    <h4 className="text-lg font-semibold text-yellow-700 mb-2">Copper → Iron → Gold → Silver</h4>
                    <p className="text-gray-700">
                      Standardized currency with intrinsic value. Durable, divisible, and widely accepted across regions.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-600 rounded-full border-4 border-white shadow-lg"></div>
                <div className="lg:w-1/2 lg:pr-12">
                  <div className="text-center lg:text-right">
                    <div className="text-6xl mb-4">🪙</div>
                    <p className="text-gray-600 italic">"Standardized value, trusted everywhere"</p>
                  </div>
                </div>
              </motion.div>

              {/* Paper Currency Era */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col lg:flex-row items-center"
              >
                <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8 border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        3
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 ml-4">Paper Currency</h3>
                    </div>
                    <h4 className="text-lg font-semibold text-green-700 mb-2">"I Promise to Pay..."</h4>
                    <p className="text-gray-700">
                      Trust-based system backed by government promise. Lightweight, portable, but dependent on institutional trust.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow-lg"></div>
                <div className="lg:w-1/2 lg:pl-12">
                  <div className="text-center lg:text-left">
                    <div className="text-6xl mb-4">💵</div>
                    <p className="text-gray-600 italic">"Signed by RBI Governor - Trust in institutions"</p>
                  </div>
                </div>
              </motion.div>

              {/* Digital Banking Era */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col lg:flex-row-reverse items-center"
              >
                <div className="lg:w-1/2 lg:pl-12 mb-8 lg:mb-0">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 border border-blue-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        4
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 ml-4">Digital Banking</h3>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-700 mb-2">Cards, Internet Banking, Mobile Apps</h4>
                    <p className="text-gray-700">
                      Electronic transactions with instant processing. Convenient but requires infrastructure and digital literacy.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                <div className="lg:w-1/2 lg:pr-12">
                  <div className="text-center lg:text-right">
                    <div className="text-6xl mb-4">💳</div>
                    <p className="text-gray-600 italic">"Swipe, tap, click - digital convenience"</p>
                  </div>
                </div>
              </motion.div>

              {/* UPI Revolution */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col lg:flex-row items-center"
              >
                <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        5
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 ml-4">UPI Revolution</h3>
                    </div>
                    <h4 className="text-lg font-semibold text-purple-700 mb-2">491M+ Users, 34% Population</h4>
                    <p className="text-gray-700">
                      Instant, interoperable payments that transformed India's financial landscape. Fast and widespread, but limited by connectivity.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                <div className="lg:w-1/2 lg:pl-12">
                  <div className="text-center lg:text-left">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-gray-600 italic">"Pay anyone, anywhere, anytime - if you have internet"</p>
                  </div>
                </div>
              </motion.div>

              {/* KASU - The Next Revolution */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col items-center"
              >
                <div className="w-full max-w-4xl">
                  <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                      <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-30 translate-y-30"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold text-2xl mr-4">
                          6
                        </div>
                        <h3 className="text-4xl font-bold">KASU Revolution</h3>
                      </div>
                      
                      <h4 className="text-2xl font-semibold text-yellow-300 mb-4">
                        The Next Evolution: Offline + Online + Inclusive
                      </h4>
                      
                      <p className="text-xl mb-8 text-blue-100">
                        Combining the best of all previous eras while solving their limitations. 
                        Works everywhere, for everyone, with or without internet.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                          <div className="text-3xl mb-2">🌐</div>
                          <h5 className="font-semibold mb-2">Offline-First</h5>
                          <p className="text-sm text-blue-100">Works without internet, syncs when available</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                          <div className="text-3xl mb-2">🔒</div>
                          <h5 className="font-semibold mb-2">Biometric Secure</h5>
                          <p className="text-sm text-blue-100">Dual fingerprint authentication</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                          <div className="text-3xl mb-2">🎤</div>
                          <h5 className="font-semibold mb-2">Voice Enabled</h5>
                          <p className="text-sm text-blue-100">Accessible to all, regardless of literacy</p>
                        </div>
                      </div>
                      
                      <div className="text-6xl mb-4">🚀</div>
                      <p className="text-lg text-yellow-200 italic font-medium">
                        "The revolution that brings 900M+ Indians into the digital economy"
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          {/* Revolution Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 bg-gray-50 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Why KASU is the Next Revolution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Offline Capability</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">900M+</div>
                <div className="text-sm text-gray-600">Rural Indians Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">0%</div>
                <div className="text-sm text-gray-600">Fraud Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
                <div className="text-sm text-gray-600">Accessibility</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              KASU combines cutting-edge technology with accessibility to create the most inclusive payment system ever built.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color} bg-gray-50`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Bridging India's Digital Divide
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Despite UPI's success with 491M+ users, 900M rural Indians still struggle with digital payments due to poor connectivity, lack of smartphones, and digital literacy barriers.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                KASU solves this by combining offline NFC technology with cloud synchronization, biometric security, and voice interfaces to create a truly universal payment system.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Works without internet connectivity</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Voice-guided for accessibility</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Biometric security prevents fraud</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-gray-700">Multi-function identity card</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">The KASU Difference</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Traditional Systems</span>
                    <span className="text-red-300">❌ Online Only</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KASU System</span>
                    <span className="text-green-300">✅ Offline + Online</span>
                  </div>
                  <div className="h-px bg-white/20"></div>
                  <div className="flex items-center justify-between">
                    <span>UPI/Cards</span>
                    <span className="text-red-300">❌ Smartphone Required</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KASU</span>
                    <span className="text-green-300">✅ No Smartphone Needed</span>
                  </div>
                  <div className="h-px bg-white/20"></div>
                  <div className="flex items-center justify-between">
                    <span>Cash</span>
                    <span className="text-red-300">❌ No Digital Trail</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>KASU</span>
                    <span className="text-green-300">✅ Complete Audit Trail</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people using KASU across India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join the Payment Revolution?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Be part of India's most inclusive payment system. Register now and get your KASU device.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
                Register Now
                <ArrowRightIcon className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link href="/auth/login" className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3">
                Already Have Account?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gradient mb-4">KASU</h3>
              <p className="text-gray-400">
                Secure Universal Identity Payment System for everyone, everywhere.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KASU. All rights reserved. Made with ❤️ for financial inclusion in India.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}