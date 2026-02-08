import { NextRequest, NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  chatId?: string
  type?: 'text' | 'image' | 'voice' | 'video' | 'document'
  from?: string
  to?: string
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')
    const chatId = request.nextUrl.searchParams.get('chatId')
    const type = request.nextUrl.searchParams.get('type')
    const from = request.nextUrl.searchParams.get('from')
    const to = request.nextUrl.searchParams.get('to')
    const limit = request.nextUrl.searchParams.get('limit') || '20'

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // In production, use full-text search with database
    // const results = await db.messages.findMany({
    //   where: {
    //     AND: [
    //       { content: { search: query } },
    //       chatId ? { chatId } : {},
    //       type ? { type } : {},
    //       from ? { timestamp: { gte: new Date(from) } } : {},
    //       to ? { timestamp: { lte: new Date(to) } } : {}
    //     ]
    //   },
    //   take: parseInt(limit)
    // })

    const results = []

    return NextResponse.json(
      {
        success: true,
        results,
        total: results.length,
        query,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
