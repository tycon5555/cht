import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, username } = await request.json()

    if (!email || !password || !displayName || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabase()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        display_name: displayName,
        username: username,
      },
    })

    if (authError) throw authError

    // Create user profile in users table
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      username,
      display_name: displayName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'online',
    })

    if (profileError) throw profileError

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username,
          display_name: displayName,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
