# Premium Messenger - Complete API Documentation

## Base URL

```
http://localhost:3000/api
https://your-domain.com/api (production)
```

## Authentication

All authenticated endpoints require the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

---

## Authentication Endpoints

### Register User

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "https://..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Status Codes:**
- 201: User created successfully
- 400: Missing or invalid fields
- 409: Email or username already exists

---

### Login User

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Status Codes:**
- 200: Login successful
- 401: Invalid credentials
- 400: Missing fields

---

## Message Endpoints

### Get Messages

**Endpoint:** `GET /messages`

**Query Parameters:**
- `chatId` (required): Chat ID
- `limit` (optional): Number of messages (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /messages?chatId=chat_123&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_1",
      "chatId": "chat_123",
      "senderId": "user_1",
      "content": "Hello!",
      "type": "text",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "seen",
      "reactions": []
    }
  ],
  "total": 100,
  "hasMore": true
}
```

**Status Codes:**
- 200: Success
- 400: Missing chatId
- 401: Unauthorized

---

### Send Message

**Endpoint:** `POST /messages/send`

**Request Body:**
```json
{
  "chatId": "chat_123",
  "content": "Hello everyone!",
  "type": "text",
  "visibility": "forever"
}
```

For image messages:
```json
{
  "chatId": "chat_123",
  "content": "Check this out",
  "type": "image",
  "imageUrl": "https://cdn.example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_456",
    "chatId": "chat_123",
    "senderId": "user_current",
    "content": "Hello everyone!",
    "type": "text",
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "sent",
    "visibility": "forever",
    "reactions": []
  }
}
```

**Status Codes:**
- 201: Message created
- 400: Invalid data
- 401: Unauthorized
- 403: Chat is closed/user blocked

---

### Delete Message

**Endpoint:** `DELETE /messages`

**Request Body:**
```json
{
  "messageId": "msg_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted"
}
```

**Status Codes:**
- 200: Deleted
- 400: Missing messageId
- 403: Not message owner
- 404: Message not found

---

### Search Messages

**Endpoint:** `GET /messages/search`

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `chatId` (optional): Limit to specific chat
- `type` (optional): Filter by type (text, image, voice, video, document)
- `limit` (optional): Results limit (default: 20)

**Example:**
```
GET /messages/search?q=hello&chatId=chat_123&limit=10
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "msg_1",
      "chatId": "chat_123",
      "content": "hello world",
      "type": "text",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "query": "hello"
}
```

**Status Codes:**
- 200: Success
- 400: Query too short

---

## Chat Endpoints

### Get All Chats

**Endpoint:** `GET /chats`

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_123",
      "type": "dm",
      "name": "John Doe",
      "avatar": "https://...",
      "participants": [...],
      "lastMessage": { ... },
      "unreadCount": 3,
      "archived": false,
      "hidden": false,
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### Create Chat

**Endpoint:** `POST /chats`

**Request Body:**
```json
{
  "type": "dm",
  "participantIds": ["user_2", "user_3"],
  "name": "Group Chat"
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_456",
    "type": "group",
    "name": "Group Chat",
    "participants": [...],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- 201: Chat created
- 400: Invalid data
- 401: Unauthorized

---

## User Profile Endpoints

### Get User Profile

**Endpoint:** `GET /users/profile`

**Query Parameters:**
- `userId` (optional): User ID (default: current user)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "https://...",
    "about": "Software engineer",
    "pronouns": "he/him",
    "online": true,
    "lastSeen": "2024-01-15T10:30:00Z",
    "verification": {
      "phoneVerified": true,
      "emailVerified": true,
      "primaryMethod": "email"
    },
    "status": {
      "message": "Working",
      "emoji": "💻",
      "expiresAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

### Update User Profile

**Endpoint:** `PUT /users/profile`

**Request Body:**
```json
{
  "displayName": "John Doe Updated",
  "about": "Full-stack developer",
  "pronouns": "he/him"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

**Status Codes:**
- 200: Updated
- 400: Invalid data
- 401: Unauthorized

---

### Verify User

**Endpoint:** `POST /users/verify`

**Step 1 - Send Code:**
```json
{
  "method": "email",
  "contact": "user@example.com",
  "step": "send"
}
```

Response:
```json
{
  "success": true,
  "message": "Verification code sent",
  "method": "email",
  "code": "123456"
}
```

**Step 2 - Verify Code:**
```json
{
  "method": "email",
  "code": "123456",
  "step": "verify"
}
```

Response:
```json
{
  "success": true,
  "message": "Verified",
  "verified": true
}
```

---

## Video Call Endpoints

### Get Video Token

**Endpoint:** `POST /video-calls/token`

**Request Body:**
```json
{
  "roomName": "chat_123_call",
  "participantName": "John Doe",
  "identity": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "chat_123_call",
  "expiresIn": 14400
}
```

**Usage:**
```typescript
const { token } = await api.getVideoToken(roomName, participantName)
// Use token to connect to Twilio Video
```

---

### End Video Call

**Endpoint:** `POST /video-calls/end`

**Request Body:**
```json
{
  "roomName": "chat_123_call",
  "participantId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "callDuration": 3600
}
```

---

## Reactions Endpoints

### Add Emoji Reaction

**Endpoint:** `POST /messages/reactions`

**Request Body:**
```json
{
  "messageId": "msg_123",
  "emoji": "👍",
  "action": "add"
}
```

**Response:**
```json
{
  "success": true,
  "reaction": {
    "emoji": "👍",
    "userId": "user_current",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### Remove Reaction

**Endpoint:** `POST /messages/reactions`

**Request Body:**
```json
{
  "messageId": "msg_123",
  "emoji": "👍",
  "action": "remove"
}
```

---

## Polls Endpoints

### Create Poll

**Endpoint:** `POST /polls`

**Request Body:**
```json
{
  "chatId": "chat_123",
  "question": "What's your favorite language?",
  "options": ["JavaScript", "Python", "Rust", "Go"],
  "anonymous": false,
  "multipleVotes": false
}
```

**Response:**
```json
{
  "success": true,
  "poll": {
    "id": "poll_123",
    "question": "What's your favorite language?",
    "options": [
      { "id": "opt_1", "text": "JavaScript", "votes": 0 },
      { "id": "opt_2", "text": "Python", "votes": 0 }
    ],
    "expiresAt": null,
    "voters": {}
  }
}
```

---

### Vote on Poll

**Endpoint:** `PUT /polls`

**Request Body:**
```json
{
  "pollId": "poll_123",
  "optionId": "opt_1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded"
}
```

---

## Admin Endpoints

### Get Statistics

**Endpoint:** `GET /admin/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "activeUsersToday": 340,
    "totalMessagesSent": 125400,
    "activeGroups": 89,
    "systemUptime": "99.98%"
  },
  "chartData": {
    "dailyMessages": [...],
    "userGrowth": [...]
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Not admin

---

## File Upload Endpoint

### Upload File

**Endpoint:** `POST /upload`

**Request:**
```
Content-Type: multipart/form-data
file: <binary>
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_123",
    "name": "image.jpg",
    "size": 2048576,
    "type": "image/jpeg",
    "url": "https://cdn.example.com/uploads/image.jpg",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Constraints:**
- Max file size: 50MB
- Allowed types: JPEG, PNG, WebP, GIF, MP3, WAV, MP4, WebM, PDF, ZIP

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 500 | Internal Server Error |

---

## Rate Limiting

API endpoints are rate-limited:
- Public endpoints: 100 requests/hour
- Authenticated endpoints: 1000 requests/hour
- Admin endpoints: 5000 requests/hour

Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705315200
```

---

## WebSocket Events

### Connect to WebSocket

```typescript
const ws = new WebSocket('wss://your-domain.com/socket')

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data)
  
  switch(type) {
    case 'message:received':
      console.log('New message:', payload)
      break
    case 'user:typing':
      console.log('User is typing:', payload.userId)
      break
    case 'call:incoming':
      console.log('Incoming call:', payload)
      break
  }
}
```

### Send Events

```typescript
ws.send(JSON.stringify({
  type: 'message:send',
  payload: { chatId, content }
}))

ws.send(JSON.stringify({
  type: 'user:typing',
  payload: { chatId }
}))
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
import { getApiClient } from '@/lib/api-client'

const api = getApiClient()

// Login
const { token, user } = await api.login('user@example.com', 'password')

// Send message
await api.sendMessage('chat_123', 'Hello!')

// Get profile
const profile = await api.getProfile('user_123')

// Get video token
const { token: videoToken } = await api.getVideoToken('room_123', 'John')
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Send message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatId":"chat_123","content":"Hello!"}'

# Get messages
curl -X GET "http://localhost:3000/api/messages?chatId=chat_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

For issues or questions, please refer to:
- Documentation: `/BACKEND_SETUP.md`
- API Routes: `/app/api/*`
- Hooks: `/hooks/*`
- Components: `/components/*`
