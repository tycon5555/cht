import { NextRequest, NextResponse } from 'next/server'

// This would use Twilio in production: npm install twilio
// import twilio from 'twilio'

interface TokenRequest {
  roomName: string
  participantName: string
  identity: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json()

    const { roomName, participantName, identity } = body

    if (!roomName || !participantName || !identity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate room name and identity
    if (roomName.length < 3 || participantName.length < 1) {
      return NextResponse.json(
        { error: 'Invalid room name or participant name' },
        { status: 400 }
      )
    }

    // In production, use Twilio:
    // const AccessToken = twilio.jwt.AccessToken
    // const VideoGrant = AccessToken.VideoGrant
    //
    // const token = new AccessToken(
    //   process.env.TWILIO_ACCOUNT_SID!,
    //   process.env.TWILIO_API_KEY!,
    //   process.env.TWILIO_API_SECRET!
    // )
    //
    // token.addGrant(new VideoGrant({ room: roomName }))
    // token.identity = identity
    //
    // return NextResponse.json({ token: token.toJwt() })

    // Mock token for development
    const mockToken = Buffer.from(
      JSON.stringify({
        jti: `${Date.now()}`,
        typ: 'application/sdp',
        iss: 'TwilioMock',
        sub: identity,
        exp: Math.floor(Date.now() / 1000) + 14400,
        grants: {
          identity: identity,
          video: {
            room: roomName,
          },
        },
      })
    ).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token: mockToken,
        roomName,
        participantName,
        expiresIn: 14400,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Video token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video token' },
      { status: 500 }
    )
  }
}
