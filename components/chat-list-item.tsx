'use client'

import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import { format } from 'date-fns'
import type { Chat } from '@/lib/types'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onClick: () => void
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const lastMessage = chat.lastMessage
  const isGroupChat = chat.type === 'group'

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
        isActive ? 'bg-accent bg-opacity-20' : 'hover:bg-muted'
      }`}
    >
      <div className="relative">
        <Avatar
          src={chat.avatar}
          alt={chat.name}
          size="md"
          online={!isGroupChat && chat.participants[0]?.online}
        />
        {chat.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-destructive text-destructive rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
          {lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {format(lastMessage.timestamp, 'HH:mm')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {lastMessage?.content || 'No messages yet'}
          </p>
        </div>
      </div>
    </motion.button>
  )
}
