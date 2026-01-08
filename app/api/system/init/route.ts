import { NextRequest, NextResponse } from 'next/server'

// Global flag to ensure services are initialized only once
let servicesInitialized = false

export async function GET(request: NextRequest) {
  try {
    if (!servicesInitialized) {
      servicesInitialized = true
      
      // Import and initialize services
      const { initializeServices } = await import('@/lib/startup.js')
      const result = initializeServices()
      
      return NextResponse.json({
        success: true,
        message: 'Background services initialized successfully',
        services: ['device-status-monitor'],
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Background services already initialized',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('❌ Failed to initialize background services:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initialize background services',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'restart') {
      // Restart services
      const { cleanupServices, initializeServices } = await import('@/lib/startup.js')
      
      cleanupServices()
      const result = initializeServices()
      
      servicesInitialized = true
      
      return NextResponse.json({
        success: true,
        message: 'Background services restarted successfully',
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        initialized: servicesInitialized,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ System init API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}