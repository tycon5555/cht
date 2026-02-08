'use client'

import { Check, CheckCheck, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Message } from '@/lib/types'
import { format } from 'date-fns'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  avatar?: string
}

const statusIcons = {
  sent: <Check className="w-4 h-4" />,
  delivered: <CheckCheck className="w-4 h-4" />,
  seen: <CheckCheck className="w-4 h-4 text-primary" />,
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  avatar,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {!isOwn && showAvatar && avatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
      )}
      <div className="flex flex-col gap-1 max-w-xs">
        <motion.div
          className={`rounded-2xl px-4 py-2 text-sm break-words ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-card text-card-foreground rounded-bl-none'
          }`}
        >
          {message.type === 'text' && <p>{message.content}</p>}
          {message.type === 'image' && message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Shared image"
              className="rounded-lg max-w-xs max-h-64 object-cover"
            />
          )}
          {message.type === 'voice' && (
            <div className="flex items-center gap-2">
              <span className="text-xs">🎤 Voice message</span>
              {message.voiceDuration && (
                <span className="text-xs opacity-70">({Math.floor(message.voiceDuration / 1000)}s)</span>
              )}
            </div>
          )}
          {message.type === 'sticker' && message.stickerUrl && (
            <img src={message.stickerUrl} alt="Sticker" className="w-24 h-24" />
          )}
        </motion.div>
        <div className={`flex items-center gap-1 text-xs text-muted-foreground px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{format(message.timestamp, 'HH:mm')}</span>
          {isOwn && (
            <div className="flex items-center gap-0.5">
              {message.isEncrypted && <Lock className="w-3 h-3" />}
              {statusIcons[message.status]}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
