# Quick Integration Guide - Using APIs & Backend

## 1. Setup (5 minutes)

### Install Dependencies
```bash
npm install
```

### Create `.env.local`
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Start Development Server
```bash
npm run dev
```

---

## 2. Using Authentication API

### Register a User

```typescript
import { getApiClient } from '@/lib/api-client'

const api = getApiClient()

// Option 1: Using API Client
const { user, token } = await api.register(
  'user@example.com',
  'johndoe',
  'John Doe',
  'SecurePassword123!'
)

// Option 2: Using Hook
import { useAuth } from '@/hooks/useAuth'

export function RegisterForm() {
  const { register } = useAuth()

  const handleRegister = async (e) => {
    e.preventDefault()
    const { user, token } = await register(
      email,
      username,
      displayName,
      password
    )
    console.log('User registered:', user)
  }

  return (
    <form onSubmit={handleRegister}>
      {/* Form fields */}
    </form>
  )
}
```

### Login a User

```typescript
const { login } = useAuth()

const handleLogin = async (email: string, password: string) => {
  const { user, token } = await login(email, password)
  // Token is automatically stored in localStorage
  // User is set in state
}
```

### Check Authentication Status

```typescript
function ProtectedPage() {
  const { verifyToken, user, isAuthenticated } = useAuth()

  useEffect(() => {
    const verified = verifyToken()
    if (!verified) {
      router.push('/login')
    }
  }, [])

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return <div>Welcome, {user?.displayName}</div>
}
```

---

## 3. Using Messages API

### Send a Message

```typescript
import { useMessages } from '@/hooks/useMessages'

export function ChatWindow({ chatId }: { chatId: string }) {
  const { messages, sendMessage, fetchMessages } = useMessages(chatId)

  useEffect(() => {
    fetchMessages()
  }, [chatId])

  const handleSend = async (content: string) => {
    try {
      await sendMessage(content, 'text')
      console.log('Message sent!')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderId}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input onSubmit={(e) => handleSend(e.target.value)} />
    </div>
  )
}
```

### Send Image Message

```typescript
const handleImageUpload = async (file: File) => {
  // Upload file first
  const { file: uploadedFile } = await api.uploadFile(file)

  // Send message with image URL
  await sendMessage(
    'Check this out!',
    'image',
    uploadedFile.url
  )
}
```

### Search Messages

```typescript
const handleSearch = async (query: string) => {
  const { results } = await api.searchMessages(query, chatId)
  console.log('Found messages:', results)
}
```

---

## 4. Using Video Call API

### Get Video Token

```typescript
import { VideoCall } from '@/components/video-call'

export function CallPage({ otherUserId }: { otherUserId: string }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const getToken = async () => {
      const { token } = await api.getVideoToken(
        `call_${Date.now()}`, // room name
        'Your Name' // participant name
      )
      setToken(token)
    }

    getToken()
  }, [])

  if (!token) {
    return <div>Loading video call...</div>
  }

  return (
    <VideoCall
      roomName={`call_${Date.now()}`}
      participantName="John Doe"
      isInitiator={true}
      onEndCall={() => router.push('/chats')}
    />
  )
}
```

---

## 5. Using Real-Time WebSocket

### Connect to WebSocket

```typescript
import { getWebSocketService } from '@/lib/websocket'

export function useChatUpdates(chatId: string) {
  const ws = getWebSocketService()

  useEffect(() => {
    // Connect
    ws.connect().catch(console.error)

    // Subscribe to messages
    const unsubscribe = ws.subscribe('message:received', (message) => {
      console.log('New message:', message)
      // Update UI
    })

    return () => {
      unsubscribe()
      ws.disconnect()
    }
  }, [])
}
```

### Send WebSocket Message

```typescript
const sendRealtimeMessage = (content: string) => {
  const ws = getWebSocketService()
  ws.send('message:send', {
    chatId,
    content,
    senderId: currentUser.id,
  })
}
```

---

## 6. Using Reactions

### Add Emoji Reaction

```typescript
const handleReaction = async (messageId: string, emoji: string) => {
  try {
    await api.addReaction(messageId, emoji)
    console.log('Reaction added!')
  } catch (error) {
    console.error('Failed to add reaction:', error)
  }
}

// In component
<button onClick={() => handleReaction(msg.id, '👍')}>
  👍
</button>
```

---

## 7. Using Polls

### Create a Poll

```typescript
const handleCreatePoll = async (
  question: string,
  options: string[]
) => {
  const { poll } = await api.createPoll(chatId, question, options)
  console.log('Poll created:', poll)
}
```

### Vote on Poll

```typescript
const handleVote = async (pollId: string, optionId: string) => {
  await api.votePoll(pollId, optionId)
  console.log('Vote recorded!')
}
```

---

## 8. Using Admin API

### Get Statistics

```typescript
export function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      const { stats, chartData } = await api.getAdminStats()
      setStats(stats)
    }

    loadStats()
  }, [])

  return (
    <div>
      <p>Total Users: {stats?.totalUsers}</p>
      <p>Active Today: {stats?.activeUsersToday}</p>
      <p>Messages: {stats?.totalMessagesSent}</p>
    </div>
  )
}
```

---

## 9. File Upload

### Upload File

```typescript
const handleFileUpload = async (file: File) => {
  try {
    const { file: uploadedFile } = await api.uploadFile(file)
    console.log('File uploaded:', uploadedFile.url)
    return uploadedFile.url
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

// In form
<input
  type="file"
  onChange={(e) => handleFileUpload(e.target.files[0])}
  accept="image/*,video/*,.pdf"
/>
```

---

## 10. Complete Chat Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { getApiClient } from '@/lib/api-client'
import { getWebSocketService } from '@/lib/websocket'

export function ChatApp() {
  const { user, isAuthenticated } = useAuth()
  const [chatId, setChatId] = useState<string | null>(null)
  const { messages, sendMessage, fetchMessages } = useMessages(chatId)
  const [newMessage, setNewMessage] = useState('')
  const api = getApiClient()
  const ws = getWebSocketService()

  useEffect(() => {
    if (!isAuthenticated) return

    // Load chats
    const loadChats = async () => {
      const { chats } = await api.getChats()
      if (chats[0]) {
        setChatId(chats[0].id)
        await fetchMessages()
      }
    }

    loadChats()

    // Connect WebSocket
    ws.connect()

    // Listen for new messages
    const unsubscribe = ws.subscribe('message:received', (msg) => {
      fetchMessages()
    })

    return () => {
      unsubscribe()
      ws.disconnect()
    }
  }, [isAuthenticated])

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return

    await sendMessage(newMessage, 'text')
    setNewMessage('')

    // Broadcast via WebSocket
    ws.send('message:send', {
      chatId,
      content: newMessage,
      senderId: user?.id,
    })
  }

  if (!isAuthenticated) {
    return <div>Please login first</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <h1>Welcome, {user?.displayName}</h1>

      <div className="flex-1 overflow-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="p-4 border-b">
            <strong>{msg.senderId}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleSend}
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 11. Error Handling

### Global Error Handler

```typescript
import { getApiClient } from '@/lib/api-client'

const api = getApiClient()

try {
  await api.sendMessage(chatId, content)
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      router.push('/login')
    } else if (error.message.includes('Chat is closed')) {
      // Show toast notification
      toast.error('This chat is closed')
    } else {
      // Generic error
      toast.error(error.message)
    }
  }
}
```

---

## 12. Next Steps

1. **Connect Database**
   - Setup PostgreSQL/Supabase
   - Run migrations
   - Update API endpoints

2. **Add Environment Variables**
   - Twilio credentials
   - Database URL
   - JWT secret
   - API keys

3. **Deploy**
   ```bash
   vercel deploy
   ```

4. **Monitor**
   - Setup Sentry for error tracking
   - Add logging with LogRocket
   - Monitor API with Datadog

---

## Testing Checklist

- [ ] Register user
- [ ] Login user
- [ ] Send message
- [ ] Search messages
- [ ] Add emoji reaction
- [ ] Create poll
- [ ] Initiate video call
- [ ] Upload file
- [ ] Get admin stats

---

## Troubleshooting

### WebSocket Not Connecting
```typescript
// Check WebSocket URL
console.log('[v0] WebSocket URL:', process.env.NEXT_PUBLIC_WS_URL)

// Try manual connection
const ws = new WebSocket('ws://localhost:3001')
```

### Video Call Token Error
```typescript
// Verify Twilio credentials
console.log('[v0] Twilio Account:', process.env.TWILIO_ACCOUNT_SID)

// Check token generation
const { token, expiresIn } = await api.getVideoToken(room, name)
```

### Message Send Failing
```typescript
// Check chat ID exists
console.log('[v0] Chat ID:', chatId)

// Verify authentication
console.log('[v0] Auth token:', localStorage.getItem('auth_token'))
```

---

## Documentation References

- **Full API Reference:** `API_DOCS.md`
- **Backend Setup:** `BACKEND_SETUP.md`
- **Advanced Features:** `ADVANCED_FEATURES.md`
- **Frontend Components:** `README.md`

Happy coding! 🚀
