'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, X } from 'lucide-react'

interface InvisibleModeModalProps {
  isOpen: boolean
  onClose: () => void
  onToggle: (enabled: boolean) => void
  isEnabled: boolean
}

export function InvisibleModeModal({ isOpen, onClose, onToggle, isEnabled }: InvisibleModeModalProps) {
  const [allowFriendsSeeOnline, setAllowFriendsSeeOnline] = useState(false)

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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEnabled ? 'bg-primary/10' : 'bg-muted/10'
            }`}>
              {isEnabled ? (
                <EyeOff className="w-5 h-5 text-primary" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">Invisible Mode</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {isEnabled
            ? 'You are currently invisible. Your contacts cannot see your online status or when you are typing.'
            : 'Activate Ghost Mode to appear offline to everyone while staying connected.'}
        </p>

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <p className="text-xs text-primary font-medium mb-2">✓ Invisible Mode Active</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• You appear offline to everyone</li>
              <li>• Your last seen is hidden</li>
              <li>• Typing indicators are disabled</li>
              <li>• "Seen" receipts show as "Delivered"</li>
              <li>• Messages still send normally</li>
            </ul>
          </motion.div>
        )}

        {!isEnabled && (
          <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              When enabled, you will:
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground mt-2">
              <li>• Appear offline to all contacts</li>
              <li>• Hide your last seen time</li>
              <li>• Stop showing typing indicators</li>
              <li>• Disable read receipts</li>
              <li>• Continue sending and receiving messages</li>
            </ul>
          </div>
        )}

        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-input transition-colors cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={allowFriendsSeeOnline}
            onChange={(e) => setAllowFriendsSeeOnline(e.target.checked)}
            className="w-4 h-4 accent-primary rounded"
          />
          <span className="text-sm text-foreground">Allow close friends to see my online status</span>
        </label>

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
              onToggle(!isEnabled)
              onClose()
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
              isEnabled
                ? 'bg-input hover:bg-input/80 text-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isEnabled ? 'Disable Invisible Mode' : 'Enable Invisible Mode'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
