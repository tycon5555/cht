import { NextRequest, NextResponse } from 'next/server'
import { supabase, getServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.searchParams.get('chatId')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const db = getServerSupabase()

    const { data: messages, error, count } = await db
      .from('messages')
      .select('*, sender:users(id, display_name, avatar_url), reactions:message_reactions(*)', {
        count: 'exact',
      })
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        messages: messages?.reverse() || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Get messages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
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

    const db = getServerSupabase()

    const { error } = await db.from('messages').delete().eq('id', messageId)

    if (error) throw error

    return NextResponse.json(
      { success: true, message: 'Message deleted' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Delete message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    )
  }
}
