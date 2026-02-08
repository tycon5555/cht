import { NextRequest, NextResponse } from 'next/server'

interface ReactionRequest {
  messageId: string
  emoji: string
  action: 'add' | 'remove'
}

export async function POST(request: NextRequest) {
  try {
    const body: ReactionRequest = await request.json()
    const { messageId, emoji, action } = body

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate emoji is a single character
    if (emoji.length !== 1 && !emoji.match(/\p{Emoji}/gu)) {
      return NextResponse.json(
        { error: 'Invalid emoji' },
        { status: 400 }
      )
    }

    const reaction = {
      emoji,
      userId: 'user_current',
      timestamp: new Date(),
    }

    if (action === 'add') {
      // In production: await db.reactions.create(reaction)
      console.log('[v0] Added reaction:', reaction)
    } else if (action === 'remove') {
      // In production: await db.reactions.delete({ messageId, emoji, userId })
      console.log('[v0] Removed reaction:', reaction)
    }

    return NextResponse.json(
      { success: true, reaction, action },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Reaction error:', error)
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    )
  }
}
