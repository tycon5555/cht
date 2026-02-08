import { NextRequest, NextResponse } from 'next/server'

interface SendMessageRequest {
  chatId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'sticker'
  imageUrl?: string
  voiceDuration?: number
  visibility?: 'forever' | 'view_once' | 'view_twice'
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json()

    const { chatId, content, type, imageUrl, voiceDuration, visibility } = body

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: 'user_current', // Get from auth session
      content,
      type,
      timestamp: new Date(),
      status: 'sent' as const,
      visibility: visibility || 'forever',
      isEncrypted: true,
      reactions: [],
      imageUrl,
      voiceDuration,
    }

    // In production, save to database
    // await db.messages.create(message)

    // Broadcast via WebSocket to other participants
    // await broadcastToChat(chatId, { type: 'message', data: message })

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
