'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, X } from 'lucide-react'

interface DisappearingMessagesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (duration: string) => void
  currentDuration?: string
  chatName: string
}

export function DisappearingMessagesModal({
  isOpen,
  onClose,
  onConfirm,
  currentDuration = 'off',
  chatName,
}: DisappearingMessagesModalProps) {
  const [selected, setSelected] = useState(currentDuration)
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen) return null

  const durations = [
    { value: 'off', label: 'Off', description: 'Messages stay forever' },
    { value: '5s', label: '5 seconds', description: 'Messages disappear after 5 seconds' },
    { value: '30s', label: '30 seconds', description: 'Messages disappear after 30 seconds' },
    { value: '1m', label: '1 minute', description: 'Messages disappear after 1 minute' },
    { value: '1h', label: '1 hour', description: 'Messages disappear after 1 hour' },
    { value: '24h', label: '24 hours', description: 'Messages disappear after 24 hours' },
  ]

  const handleConfirm = () => {
    setIsConfirming(true)
    onConfirm(selected)
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
        className="bg-card border border-border rounded-2xl p-6 max-w-md mx-4 shadow-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4 sticky top-0 bg-card pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Disappearing Messages</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Messages sent in this chat with <span className="font-semibold text-foreground">{chatName}</span> will disappear after the selected time.
        </p>

        <div className="space-y-2 mb-6">
          {durations.map((duration) => (
            <motion.label
              key={duration.value}
              whileHover={{ backgroundColor: 'var(--color-input)' }}
              className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-input transition-colors border border-border"
            >
              <input
                type="radio"
                name="duration"
                value={duration.value}
                checked={selected === duration.value}
                onChange={() => setSelected(duration.value)}
                className="w-4 h-4 mt-1 accent-primary flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{duration.label}</p>
                <p className="text-xs text-muted-foreground">{duration.description}</p>
              </div>
            </motion.label>
          ))}
        </div>

        <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            ℹ️ Disappearing messages only apply to new messages. Existing messages will remain.
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
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors font-medium"
          >
            {isConfirming ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
