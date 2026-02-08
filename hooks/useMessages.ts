import { useState, useCallback } from 'react'
import { useApi } from './useApi'

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<any[]>([])
  const fetchApi = useApi('/api/messages')
  const sendApi = useApi('/api/messages/send')
  const deleteApi = useApi('/api/messages', { method: 'DELETE' })

  const fetchMessages = useCallback(
    async (limit = 50, offset = 0) => {
      if (!chatId) return

      try {
        const response = await fetch(
          `/api/messages?chatId=${chatId}&limit=${limit}&offset=${offset}`
        )
        const data = await response.json()
        setMessages(data.messages || [])
        return data
      } catch (error) {
        console.error('[v0] Fetch messages error:', error)
        throw error
      }
    },
    [chatId]
  )

  const sendMessage = useCallback(
    async (content: string, type: string = 'text') => {
      if (!chatId) return

      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            content,
            type,
            visibility: 'forever',
          }),
        })

        const data = await response.json()
        if (data.message) {
          setMessages((prev) => [...prev, data.message])
        }
        return data
      } catch (error) {
        console.error('[v0] Send message error:', error)
        throw error
      }
    },
    [chatId]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch('/api/messages', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        })

        const data = await response.json()
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        return data
      } catch (error) {
        console.error('[v0] Delete message error:', error)
        throw error
      }
    },
    []
  )

  return {
    messages,
    fetchMessages,
    sendMessage,
    deleteMessage,
  }
}
