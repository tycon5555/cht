'use client'

import { useEffect, useRef } from 'react'
import { Phone, Video } from 'lucide-react'
import { Avatar } from './avatar'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { DmActionsMenu } from './dm-actions-menu'
import { motion } from 'framer-motion'
import type { Chat, User } from '@/lib/types'

interface ChatWindowProps {
  chat: Chat
  currentUser: User
  onSendMessage: (content: string) => void
  onCall: (type: 'voice' | 'video') => void
  onClose?: () => void
  onDelete?: () => void
  onDisappearing?: () => void
  onBlock?: () => void
  onReport?: () => void
  onArchive?: () => void
  isBlocked?: boolean
}

export function ChatWindow({
  chat,
  currentUser,
  onSendMessage,
  onCall,
  onClose,
  onDelete,
  onDisappearing,
  onBlock,
  onReport,
  onArchive,
  isBlocked = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  const isGroupChat = chat.type === 'group'
  const otherUser = chat.participants.find((p) => p.id !== currentUser.id)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={chat.avatar}
            alt={chat.name}
            size="md"
            online={!isGroupChat && otherUser?.online}
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm">{chat.name}</h2>
            <p className="text-xs text-muted-foreground">
              {isGroupChat ? `${chat.participants.length} members` : otherUser?.online ? 'Online' : `Last seen ${otherUser?.lastSeen || 'recently'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCall('voice')}
            disabled={isBlocked || chat.closed}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-5 h-5 text-primary" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCall('video')}
            disabled={isBlocked || chat.closed}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5 text-primary" />
          </motion.button>
          {!isGroupChat && (
            <DmActionsMenu
              chat={chat}
              isClosed={chat.closed}
              onClose={onClose}
              onDelete={onDelete}
              onDisappearing={onDisappearing}
              onBlock={onBlock}
              onReport={onReport}
              onArchive={onArchive}
            />
          )}
        </div>
      </div>

      {/* Closed Chat Notice */}
      {chat.closed && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3 text-center">
          <p className="text-sm text-destructive font-medium">🔒 This conversation is closed</p>
          <p className="text-xs text-muted-foreground mt-1">You cannot send messages to this chat</p>
        </div>
      )}

      {/* Blocked User Notice */}
      {isBlocked && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3 text-center">
          <p className="text-sm text-destructive font-medium">🚫 You have blocked this user</p>
          <p className="text-xs text-muted-foreground mt-1">Messaging and calls are unavailable</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chat.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Avatar
                src={chat.avatar}
                alt={chat.name}
                size="lg"
              />
              <p className="mt-4 font-semibold text-sm">{chat.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isGroupChat ? 'Start the conversation' : 'Say hello!'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {chat.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.id}
                showAvatar={isGroupChat}
              />
            ))}
            {chat.typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground italic py-2"
              >
                {chat.typingUsers.length === 1 ? 'Someone is' : 'Multiple people are'} typing...
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {!chat.closed && !isBlocked ? (
        <MessageInput onSend={onSendMessage} />
      ) : (
        <div className="border-t border-border p-4 bg-card/50">
          <div className="w-full h-10 bg-input rounded-2xl flex items-center px-4 text-muted-foreground text-sm">
            {chat.closed ? 'This conversation is closed' : 'You cannot message this user'}
          </div>
        </div>
      )}
    </div>
  )
}
