import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'KASU - Secure Universal Identity Payment System',
  description: 'Revolutionary offline-first payment system for financial inclusion in India. Secure, accessible, and works everywhere.',
  keywords: 'KASU, payment system, NFC, offline payments, financial inclusion, India, secure transactions',
  authors: [{ name: 'KASU Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  openGraph: {
    title: 'KASU - Secure Universal Identity Payment System',
    description: 'Revolutionary offline-first payment system for financial inclusion in India',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KASU - Secure Universal Identity Payment System',
    description: 'Revolutionary offline-first payment system for financial inclusion in India',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}