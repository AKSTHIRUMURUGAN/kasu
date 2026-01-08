import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    return { user: decoded, error: null }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

export function requireAdmin(request) {
  const tokenResult = verifyToken(request)
  if (tokenResult.error) {
    return { error: tokenResult.error, status: tokenResult.status }
  }

  if (tokenResult.user.role !== 'admin' && tokenResult.user.role !== 'super_admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { user: tokenResult.user, error: null }
}

export function createErrorResponse(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  )
}