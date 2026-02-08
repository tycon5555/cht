# Backend Setup & API Documentation

## Overview

This document covers the complete backend implementation for the Premium Messenger application, including all API endpoints, authentication, database setup, and video call integration.

## Technology Stack

- **Runtime:** Node.js + Next.js 16 (API Routes)
- **Database:** PostgreSQL, Supabase, or Prisma ORM
- **Authentication:** JWT + Session Cookies
- **Video Calls:** Twilio Video
- **File Storage:** AWS S3, Supabase Storage, or Cloudinary
- **Real-time:** WebSockets (Socket.io or Supabase Realtime)
- **Email:** SendGrid or Mailgun
- **SMS:** Twilio

## API Endpoints

### Authentication Routes

**POST /api/auth/register**
- Register new user account
- Body: `{ email, username, displayName, password }`
- Returns: `{ user, token }`

**POST /api/auth/login**
- Login user
- Body: `{ email, password }`
- Returns: `{ user, token }`

**POST /api/auth/logout**
- Logout user
- Returns: `{ success: true }`

**POST /api/auth/refresh**
- Refresh authentication token
- Returns: `{ token, expiresIn }`

### Message Routes

**GET /api/messages**
- Fetch messages for a chat
- Query: `chatId`, `limit`, `offset`
- Returns: `{ messages, total, hasMore }`

**POST /api/messages/send**
- Send a message
- Body: `{ chatId, content, type, visibility }`
- Returns: `{ message }`

**DELETE /api/messages**
- Delete a message
- Body: `{ messageId }`
- Returns: `{ success }`

**GET /api/messages/search**
- Search messages
- Query: `q`, `chatId`, `type`, `limit`
- Returns: `{ results, total }`

### Chat Routes

**GET /api/chats**
- Get all user chats
- Returns: `{ chats }`

**POST /api/chats**
- Create new chat
- Body: `{ type, participantIds, name }`
- Returns: `{ chat }`

**PUT /api/chats/{id}**
- Update chat settings
- Body: `{ archived, hidden, name, settings }`
- Returns: `{ chat }`

**DELETE /api/chats/{id}**
- Delete chat
- Returns: `{ success }`

### User Routes

**GET /api/users/profile**
- Get user profile
- Query: `userId`
- Returns: `{ user }`

**PUT /api/users/profile**
- Update profile
- Body: `{ displayName, username, about, avatar }`
- Returns: `{ user }`

**POST /api/users/verify**
- Start verification process
- Body: `{ method, contact, step }`
- Returns: `{ message }`

**GET /api/users/{id}/status**
- Get user status
- Returns: `{ status, onlineAt }`

### Video Call Routes

**POST /api/video-calls/token**
- Generate video call token
- Body: `{ roomName, participantName, identity }`
- Returns: `{ token, roomName, expiresIn }`

**POST /api/video-calls/end**
- End video call
- Body: `{ roomName, participantId }`
- Returns: `{ success }`

### Reactions Routes

**POST /api/messages/reactions**
- Add/remove emoji reaction
- Body: `{ messageId, emoji, action }`
- Returns: `{ reaction, action }`

### Polls Routes

**POST /api/polls**
- Create a poll
- Body: `{ chatId, question, options, anonymous }`
- Returns: `{ poll }`

**PUT /api/polls**
- Vote on a poll
- Body: `{ pollId, optionId }`
- Returns: `{ success }`

### Admin Routes

**GET /api/admin/stats**
- Get system statistics
- Returns: `{ stats, chartData }`

**GET /api/admin/users**
- List all users
- Query: `limit`, `offset`, `role`
- Returns: `{ users, total }`

**POST /api/admin/users/{id}/suspend**
- Suspend user account
- Body: `{ reason, duration }`
- Returns: `{ success }`

**POST /api/admin/users/{id}/ban**
- Ban user permanently
- Body: `{ reason }`
- Returns: `{ success }`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR,
  avatar_url VARCHAR,
  password_hash VARCHAR,
  phone_verified BOOLEAN,
  email_verified BOOLEAN,
  role VARCHAR DEFAULT 'user',
  suspended BOOLEAN DEFAULT FALSE,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Chats Table
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY,
  type VARCHAR (dm, group),
  name VARCHAR,
  avatar_url VARCHAR,
  created_by UUID,
  archived BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID,
  sender_id UUID,
  content TEXT,
  type VARCHAR (text, image, voice, sticker),
  status VARCHAR (sent, delivered, seen),
  visibility VARCHAR,
  encrypted BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### Video Calls Table
```sql
CREATE TABLE video_calls (
  id UUID PRIMARY KEY,
  room_name VARCHAR,
  initiator_id UUID,
  participant_id UUID,
  status VARCHAR (active, ended),
  duration_seconds INT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  FOREIGN KEY (initiator_id) REFERENCES users(id),
  FOREIGN KEY (participant_id) REFERENCES users(id)
);
```

## Environment Variables

Create a `.env.local` file with these variables:

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/messenger

# Twilio (Video Calls)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your-secret-min-32-chars
SESSION_SECRET=your-session-secret

# Email Service
SENDGRID_API_KEY=your-api-key

# AWS S3 (File Upload)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=bucket-name
AWS_REGION=us-east-1

# Vercel
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

**Option A: Using Supabase**
```bash
npm install @supabase/supabase-js
```

**Option B: Using Prisma**
```bash
npm install @prisma/client prisma
npx prisma init
npx prisma migrate dev --name init
```

### 3. Configure Twilio for Video Calls

```bash
npm install twilio
```

1. Get credentials from https://twilio.com
2. Add to `.env.local`
3. Video calls work immediately via `/api/video-calls/token`

### 4. Configure File Upload

**Using AWS S3:**
```bash
npm install @aws-sdk/client-s3
```

**Using Supabase Storage:**
```bash
# Already included with @supabase/supabase-js
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Frontend Integration

### Using useAuth Hook

```typescript
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login, user } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
  }

  return <div>{user?.displayName}</div>
}
```

### Using useMessages Hook

```typescript
import { useMessages } from '@/hooks/useMessages'

export default function ChatWindow() {
  const { messages, sendMessage } = useMessages(chatId)

  return (
    <div>
      {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
      <input onSubmit={e => sendMessage(e.target.value)} />
    </div>
  )
}
```

### Using Video Call Component

```typescript
import { VideoCall } from '@/components/video-call'

export default function CallPage() {
  return (
    <VideoCall
      roomName="chat-123"
      participantName="John Doe"
      isInitiator={true}
      onEndCall={() => router.push('/chats')}
    />
  )
}
```

## WebSocket Setup (Real-time Messaging)

### Option 1: Using Socket.io

```bash
npm install socket.io socket.io-client
```

Create `/pages/api/socket.js`:
```typescript
import { Server } from 'socket.io'

export default function handler(req, res) {
  if (res.socket.server.io) {
    return res.status(200).json({ message: 'Socket already running' })
  }

  const io = new Server(res.socket.server)

  io.on('connection', (socket) => {
    console.log('[v0] User connected:', socket.id)

    socket.on('message:send', (data) => {
      io.emit('message:receive', data)
    })

    socket.on('disconnect', () => {
      console.log('[v0] User disconnected')
    })
  })

  res.socket.server.io = io
  res.status(200).json({ message: 'Socket initialized' })
}
```

### Option 2: Using Supabase Realtime

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(URL, KEY)

supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('[v0] New message:', payload)
    }
  )
  .subscribe()
```

## Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Environment Variables in Vercel

1. Go to Vercel Project Settings
2. Add environment variables from `.env.example`
3. Deploy

### Database in Production

Use managed databases:
- **Supabase:** Hosted PostgreSQL
- **AWS RDS:** Managed PostgreSQL
- **Railway:** Easy hosting
- **PlanetScale:** MySQL hosting

## Security Checklist

- [x] Use HTTPS/TLS everywhere
- [x] Hash passwords with bcrypt
- [x] Validate all inputs
- [x] Use CORS properly
- [x] Rate limit API endpoints
- [x] Implement CSRF protection
- [x] Use secure session cookies
- [x] Encrypt sensitive data
- [x] Log security events
- [x] Regular security audits

## Performance Optimization

- Use database indexes on frequently queried fields
- Implement caching with Redis
- Use CDN for file uploads
- Pagination for large datasets
- Query optimization
- Lazy loading in frontend

## Monitoring & Logging

```typescript
// Log API calls
console.log('[v0] API call:', method, path, status)

// Use services like:
// - Sentry (error tracking)
// - LogRocket (session replay)
// - Datadog (monitoring)
```

## Support & Documentation

- API Routes: `/app/api/*`
- Hooks: `/hooks/*`
- Components: `/components/*`
- Types: `/lib/types.ts`
- Store: `/lib/store.ts`
