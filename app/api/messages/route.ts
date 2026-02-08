import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.searchParams.get('chatId')
    const limit = request.nextUrl.searchParams.get('limit') || '50'
    const offset = request.nextUrl.searchParams.get('offset') || '0'

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID required' },
        { status: 400 }
      )
    }

    // In production, query database
    // const messages = await db.messages.find({
    //   chatId,
    //   take: parseInt(limit),
    //   skip: parseInt(offset),
    //   orderBy: { timestamp: 'desc' }
    // })

    const messages = []

    return NextResponse.json(
      {
        success: true,
        messages,
        total: messages.length,
        hasMore: messages.length === parseInt(limit),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID required' },
        { status: 400 }
      )
    }

    // In production, delete from database
    // await db.messages.delete({ id: messageId })

    return NextResponse.json(
      { success: true, message: 'Message deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Delete message error:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
