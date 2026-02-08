import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface RegisterRequest {
  email: string
  username: string
  displayName: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()

    const { email, username, displayName, password } = body

    if (!email || !username || !displayName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Hash password using crypto (in production, use bcrypt)
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex')

    // In production, save to database (Supabase, Prisma, etc.)
    const user = {
      id: `user_${crypto.randomUUID()}`,
      email,
      username,
      displayName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date(),
      verified: false,
      passwordHash: hash,
      salt: salt,
    }

    // Set secure session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        token: crypto.randomBytes(32).toString('hex'),
      },
      { status: 201 }
    )

    response.cookies.set('session', crypto.randomBytes(32).toString('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
