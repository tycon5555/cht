'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, X } from 'lucide-react'

interface CloseChatModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  chatName: string
}

export function CloseChatModal({ isOpen, onClose, onConfirm, chatName }: CloseChatModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen) return null

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
              <Lock className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Close Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Closing this conversation with <span className="font-semibold text-foreground">{chatName}</span> will:
        </p>

        <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Remove it from your main chat list</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Prevent new messages from being sent</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Store it in "Closed Conversations"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive mt-1">•</span>
            <span>Allow you to reopen later</span>
          </li>
        </ul>

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
            onClick={() => {
              setIsConfirming(true)
              onConfirm()
              setTimeout(() => setIsConfirming(false), 500)
            }}
            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors font-medium"
          >
            {isConfirming ? 'Closing...' : 'Close Chat'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
