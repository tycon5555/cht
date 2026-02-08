// WebSocket service for real-time messaging

export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private listeners: Map<string, Set<Function>> = new Map()

  constructor(url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {
    this.url = url
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('[v0] WebSocket connected')
          this.reconnectAttempts = 0
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[v0] WebSocket message:', data)
            this.emit(data.type, data.payload)
          } catch (error) {
            console.error('[v0] WebSocket parse error:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('[v0] WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('[v0] WebSocket closed')
          this.emit('disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  send(type: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[v0] WebSocket not connected')
      return
    }

    this.ws.send(JSON.stringify({ type, payload }))
  }

  subscribe(type: string, callback: Function): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    this.listeners.get(type)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback)
    }
  }

  private emit(type: string, payload?: any): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach((callback) => callback(payload))
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts
      console.log(`[v0] Reconnecting in ${delay}ms...`)

      setTimeout(() => {
        console.log(`[v0] Reconnection attempt ${this.reconnectAttempts}`)
        this.connect().catch(() => {
          this.attemptReconnect()
        })
      }, delay)
    } else {
      console.error('[v0] Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null

export function getWebSocketService(): WebSocketService {
  if (!wsInstance) {
    wsInstance = new WebSocketService()
  }
  return wsInstance
}
