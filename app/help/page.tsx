'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "What is KASU?",
    answer: "KASU is a secure universal identity payment system that allows you to make offline NFC transactions and manage your digital wallet. It combines the convenience of digital payments with the reliability of offline functionality.",
    category: "General"
  },
  {
    id: 2,
    question: "How do I register for KASU?",
    answer: "To register for KASU, visit our registration page and provide your personal details including name, phone number, email, and Aadhaar number. After admin verification, you'll be assigned a KASU device.",
    category: "Account"
  },
  {
    id: 3,
    question: "How do offline transactions work?",
    answer: "KASU devices can perform NFC-based transactions without internet connectivity. Transactions are stored locally on the device and automatically sync to the cloud when internet connection is available.",
    category: "Transactions"
  },
  {
    id: 4,
    question: "Is my money safe with KASU?",
    answer: "Yes, KASU uses multiple layers of security including biometric authentication, encrypted storage, and secure transaction protocols. All transactions are verified and recorded on our secure servers.",
    category: "Security"
  },
  {
    id: 5,
    question: "How do I add money to my KASU wallet?",
    answer: "You can add money to your KASU wallet through our web dashboard using various payment methods including UPI, cards, and net banking. The money will be instantly available in your wallet.",
    category: "Wallet"
  },
  {
    id: 6,
    question: "What if I lose my KASU device?",
    answer: "If you lose your KASU device, immediately contact our support team. We can block the device remotely and issue you a new one. Your funds remain safe as they're secured by biometric authentication.",
    category: "Device"
  },
  {
    id: 7,
    question: "Can I use KASU without internet?",
    answer: "Yes! KASU is designed to work offline. You can make peer-to-peer transactions using NFC even without internet connectivity. Transactions will sync automatically when you're back online.",
    category: "Transactions"
  },
  {
    id: 8,
    question: "How do I check my transaction history?",
    answer: "You can view your complete transaction history by logging into your KASU dashboard and navigating to the 'Transactions' section. You can filter transactions by type, date, and status.",
    category: "Transactions"
  },
  {
    id: 9,
    question: "What documents do I need for verification?",
    answer: "For account verification, you need a valid Aadhaar number (mandatory), and optionally PAN card and driving license. All documents help in faster verification and enhanced security features.",
    category: "Account"
  },
  {
    id: 10,
    question: "How long does device assignment take?",
    answer: "After successful registration and document verification by our admin team, device assignment typically takes 2-3 business days. You'll receive a notification once your device is ready.",
    category: "Device"
  }
]

const categories = ["All", "General", "Account", "Transactions", "Security", "Wallet", "Device"]

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-2xl font-bold text-gradient">KASU</h1>
              <span className="ml-4 text-gray-600">Help & Support</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <QuestionMarkCircleIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How can we help you?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Find answers to common questions about KASU
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 mb-12">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm border">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {faq.category}
                    </span>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Still need help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h4>
              <p className="text-gray-600 mb-4">Speak with our support team</p>
              <a href="tel:+911234567890" className="text-primary-600 hover:text-primary-700 font-medium">
                +91 12345 67890
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h4>
              <p className="text-gray-600 mb-4">Send us your questions</p>
              <a href="mailto:support@kasu.com" className="text-primary-600 hover:text-primary-700 font-medium">
                support@kasu.com
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h4>
              <p className="text-gray-600 mb-4">Chat with us in real-time</p>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h4>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/profile" className="text-primary-600 hover:text-primary-700">
              Profile Settings
            </Link>
            <Link href="/transactions" className="text-primary-600 hover:text-primary-700">
              Transaction History
            </Link>
            <Link href="/settings" className="text-primary-600 hover:text-primary-700">
              Account Settings
            </Link>
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}