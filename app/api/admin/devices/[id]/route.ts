import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { KasuDevice } from '@/lib/models'
import { requireAdmin, createErrorResponse } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    // Check admin role
    const authResult = requireAdmin(request)
    if (authResult.error) {
      return createErrorResponse(authResult.error, authResult.status)
    }

    // Await the params promise (Next.js 16 requirement)
    const params = await context.params
    const { id } = params

    // Find the device
    const device = await KasuDevice.findById(id)
    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      )
    }

    // Check if device is unassigned
    if (device.status !== 'unassigned') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete assigned device' },
        { status: 400 }
      )
    }

    // Delete the device
    await KasuDevice.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully'
    })

  } catch (error) {
    console.error('Device deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}