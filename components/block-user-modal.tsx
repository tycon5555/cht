'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Ban, X } from 'lucide-react'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface BlockUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  user: User | null
}

export function BlockUserModal({ isOpen, onClose, onConfirm, user }: BlockUserModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen || !user) return null

  const handleConfirm = () => {
    setIsConfirming(true)
    onConfirm()
    setTimeout(() => {
      setIsConfirming(false)
      onClose()
    }, 500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-4 shadow-xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Ban className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Block User</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 bg-input rounded-lg">
          <Avatar src={user.avatar} alt={user.displayName} size="md" />
          <div>
            <p className="font-medium text-foreground">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          When you block this user, they will:
        </p>

        <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Not be able to send you messages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Not see your online status</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Not see your last seen time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Not be able to call you</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Be removed from your friends list</span>
          </li>
        </ul>

        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive">
            You can unblock this user anytime in Settings → Privacy → Blocked Users.
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-input hover:bg-input/80 text-foreground rounded-lg transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground rounded-lg transition-colors font-medium"
          >
            {isConfirming ? 'Blocking...' : 'Block User'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
