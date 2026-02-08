import { NextRequest, NextResponse } from 'next/server'

interface VerifyRequest {
  method: 'phone' | 'email'
  contact?: string
  code?: string
  step: 'send' | 'verify'
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json()
    const { method, contact, code, step } = body

    if (!method || !step) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (step === 'send') {
      if (!contact) {
        return NextResponse.json(
          { error: 'Contact information required' },
          { status: 400 }
        )
      }

      // Validate email or phone
      if (method === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contact)) {
          return NextResponse.json(
            { error: 'Invalid email' },
            { status: 400 }
          )
        }
      } else if (method === 'phone') {
        const phoneRegex = /^\+?[\d\s\-()]+$/
        if (!phoneRegex.test(contact)) {
          return NextResponse.json(
            { error: 'Invalid phone number' },
            { status: 400 }
          )
        }
      }

      // In production, send OTP via Twilio, SendGrid, etc.
      const mockOtp = '123456'

      return NextResponse.json(
        {
          success: true,
          message: `Verification code sent to ${contact}`,
          method,
          contact,
          // For testing only - remove in production
          code: mockOtp,
        },
        { status: 200 }
      )
    } else if (step === 'verify') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code required' },
          { status: 400 }
        )
      }

      // In production: verify code from database
      if (code === '123456' || code.length === 6) {
        // In production: await db.users.update({ 
        //   id: userId,
        //   verification: { [method + 'Verified']: true }
        // })

        return NextResponse.json(
          {
            success: true,
            message: 'Verification successful',
            verified: true,
          },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid step' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
