'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './avatar'

interface NotificationToastProps {
  id: string
  username: string
  message: string
  type: 'message' | 'image' | 'voice'
  avatar?: string
  onClose: () => void
}

export function NotificationToast({
  id,
  username,
  message,
  type,
  avatar,
  onClose,
}: NotificationToastProps) {
  const getTypeText = () => {
    switch (type) {
      case 'image':
        return `${username} sent an image`
      case 'voice':
        return `${username} sent a voice message`
      default:
        return username
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      className="bg-card border border-border rounded-xl p-4 shadow-2xl flex items-start gap-3"
    >
      {avatar && <Avatar src={avatar} alt={username} size="sm" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{getTypeText()}</p>
        <p className="text-xs text-muted-foreground truncate">{message}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground p-1"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}
