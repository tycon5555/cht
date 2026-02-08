// API Client for all backend communication

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        this.token = token
        this.headers['Authorization'] = `Bearer ${token}`
      }
    }
  }

  setToken(token: string): void {
    this.token = token
    this.headers['Authorization'] = `Bearer ${token}`
    localStorage.setItem('auth_token', token)
  }

  clearToken(): void {
    this.token = null
    delete this.headers['Authorization']
    localStorage.removeItem('auth_token')
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const options: RequestInit = {
      method,
      headers: this.headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (response.status === 401) {
        this.clearToken()
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[v0] API error:', error)
      throw error
    }
  }

  // Auth endpoints
  async register(email: string, username: string, displayName: string, password: string) {
    return this.request('/api/auth/register', 'POST', {
      email,
      username,
      displayName,
      password,
    })
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', 'POST', { email, password })
  }

  async logout() {
    return this.request('/api/auth/logout', 'POST')
  }

  // Messages endpoints
  async getMessages(chatId: string, limit = 50, offset = 0) {
    return this.request(`/api/messages?chatId=${chatId}&limit=${limit}&offset=${offset}`, 'GET')
  }

  async sendMessage(chatId: string, content: string, type = 'text') {
    return this.request('/api/messages/send', 'POST', {
      chatId,
      content,
      type,
      visibility: 'forever',
    })
  }

  async deleteMessage(messageId: string) {
    return this.request('/api/messages', 'DELETE', { messageId })
  }

  async searchMessages(query: string, chatId?: string) {
    const params = new URLSearchParams({ q: query })
    if (chatId) params.append('chatId', chatId)
    return this.request(`/api/messages/search?${params}`, 'GET')
  }

  // Chat endpoints
  async getChats() {
    return this.request('/api/chats', 'GET')
  }

  async createChat(type: string, participantIds: string[], name?: string) {
    return this.request('/api/chats', 'POST', {
      type,
      participantIds,
      name,
    })
  }

  async updateChat(chatId: string, updates: any) {
    return this.request(`/api/chats/${chatId}`, 'PUT', updates)
  }

  // User endpoints
  async getProfile(userId?: string) {
    const params = userId ? `?userId=${userId}` : ''
    return this.request(`/api/users/profile${params}`, 'GET')
  }

  async updateProfile(updates: any) {
    return this.request('/api/users/profile', 'PUT', updates)
  }

  async verifyUser(method: 'phone' | 'email', step: 'send' | 'verify', contact?: string, code?: string) {
    return this.request('/api/users/verify', 'POST', {
      method,
      contact,
      code,
      step,
    })
  }

  // Video call endpoints
  async getVideoToken(roomName: string, participantName: string) {
    return this.request('/api/video-calls/token', 'POST', {
      roomName,
      participantName,
      identity: `user_${Date.now()}`,
    })
  }

  async endVideoCall(roomName: string, participantId: string) {
    return this.request('/api/video-calls/end', 'POST', {
      roomName,
      participantId,
    })
  }

  // Reactions endpoints
  async addReaction(messageId: string, emoji: string) {
    return this.request('/api/messages/reactions', 'POST', {
      messageId,
      emoji,
      action: 'add',
    })
  }

  async removeReaction(messageId: string, emoji: string) {
    return this.request('/api/messages/reactions', 'POST', {
      messageId,
      emoji,
      action: 'remove',
    })
  }

  // Polls endpoints
  async createPoll(chatId: string, question: string, options: string[]) {
    return this.request('/api/polls', 'POST', {
      chatId,
      question,
      options,
      anonymous: false,
      multipleVotes: false,
    })
  }

  async votePoll(pollId: string, optionId: string) {
    return this.request('/api/polls', 'PUT', {
      pollId,
      optionId,
    })
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/api/admin/stats', 'GET')
  }

  // File upload
  async uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const options: RequestInit = {
      method: 'POST',
      headers: { Authorization: this.headers['Authorization'] },
      body: formData,
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, options)
    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }
}

// Singleton instance
let apiInstance: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!apiInstance) {
    apiInstance = new ApiClient()
  }
  return apiInstance
}
