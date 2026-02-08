import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // In production, query database for user
    // For now, mock user authentication
    const user = {
      id: `user_${crypto.randomUUID()}`,
      email,
      displayName: email.split('@')[0],
      username: email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      verified: true,
    }

    const response = NextResponse.json(
      {
        success: true,
        user,
        token: crypto.randomBytes(32).toString('hex'),
      },
      { status: 200 }
    )

    response.cookies.set('session', crypto.randomBytes(32).toString('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
