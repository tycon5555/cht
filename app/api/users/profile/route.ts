import { NextRequest, NextResponse } from 'next/server'

interface UpdateProfileRequest {
  displayName?: string
  username?: string
  about?: string
  avatar?: string
  pronouns?: string
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'user_current'

    // In production: await db.users.findUnique({ id: userId })
    const user = {
      id: userId,
      username: 'john_doe',
      displayName: 'John Doe',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      about: 'Software engineer and coffee enthusiast',
      pronouns: 'he/him',
      online: true,
      lastSeen: new Date(),
      verification: {
        phoneVerified: true,
        emailVerified: true,
        primaryMethod: 'email',
      },
      status: {
        message: 'Working on a project',
        emoji: '💻',
        expiresAt: new Date(Date.now() + 3600000),
      },
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Get profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProfileRequest = await request.json()
    const { displayName, username, about, avatar, pronouns } = body

    if (!displayName && !username && !about && !avatar && !pronouns) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // In production: await db.users.update({ id: userId, data: body })
    const updatedUser = {
      id: 'user_current',
      displayName: displayName || 'John Doe',
      username: username || 'john_doe',
      avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      about: about || '',
      pronouns: pronouns || '',
    }

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
