'use client'

import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import type { Chat } from '@/lib/types'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onSelect: () => void
}

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const lastMessage = chat.lastMessage
  const isGroupChat = chat.type === 'group'
  const isUnread = chat.unreadCount > 0

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 24) {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <motion.button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-primary/15 border-l-4 border-primary text-foreground'
          : 'hover:bg-muted/50 text-foreground/80'
      }`}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar src={chat.avatar} alt={chat.name} size="md" />
        {!isGroupChat && chat.participants[0]?.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
        )}
      </div>

      {/* Chat info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>
            {chat.name}
          </p>
          {lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p className={`text-xs truncate ${isUnread ? 'text-foreground/70 font-medium' : 'text-muted-foreground'}`}>
          {lastMessage?.content || 'No messages yet'}
        </p>
      </div>

      {/* Unread badge */}
      {isUnread && (
        <div className="flex-shrink-0 flex items-center justify-center min-w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-bold">
          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
        </div>
      )}
    </motion.button>
  )
}
