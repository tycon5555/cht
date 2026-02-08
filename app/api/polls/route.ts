import { NextRequest, NextResponse } from 'next/server'

interface CreatePollRequest {
  chatId: string
  question: string
  options: string[]
  anonymous: boolean
  multipleVotes: boolean
  expiresIn?: number
}

interface VotePollRequest {
  pollId: string
  optionId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePollRequest = await request.json()
    const { chatId, question, options, anonymous, multipleVotes, expiresIn } = body

    if (!chatId || !question || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Invalid poll data' },
        { status: 400 }
      )
    }

    const poll = {
      id: `poll_${Date.now()}`,
      chatId,
      question,
      options: options.map((text, i) => ({
        id: `opt_${i}`,
        text,
        votes: 0,
      })),
      anonymous,
      multipleVotes,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : null,
      createdAt: new Date(),
      voters: {},
    }

    // In production: await db.polls.create(poll)

    return NextResponse.json(
      { success: true, poll },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Create poll error:', error)
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: VotePollRequest = await request.json()
    const { pollId, optionId } = body

    if (!pollId || !optionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production: 
    // const poll = await db.polls.findUnique({ id: pollId })
    // Update vote count and track voter

    return NextResponse.json(
      { success: true, message: 'Vote recorded' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Poll vote error:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
