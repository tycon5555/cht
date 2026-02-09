import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 100,
      },
    },
  }
)

// Server-side Supabase client (for API routes)
let serverSupabase: ReturnType<typeof createClient<Database>> | null = null

export function getServerSupabase() {
  if (serverSupabase) return serverSupabase

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  serverSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return serverSupabase
}

// Helper to get authenticated user
export async function getAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Helper to sign up
export async function signUp(email: string, password: string, metadata: Record<string, string>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) throw error
  return data
}

// Helper to sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Helper to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Subscribe to real-time changes
export function subscribeToMessages(chatId: string, callback: (message: any) => void) {
  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// Subscribe to user presence
export function subscribeToUserPresence(callback: (users: any[]) => void) {
  return supabase
    .channel('presence')
    .on('presence', { event: 'sync' }, () => {
      const userList = supabase.channel('presence').presenceState()
      const allUsers = Object.values(userList).flat()
      callback(allUsers)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const user = await getAuthUser()
        if (user) {
          await supabase.channel('presence').track({
            user_id: user.id,
            status: 'online',
            timestamp: new Date().toISOString(),
          })
        }
      }
    })
}

export default supabase
