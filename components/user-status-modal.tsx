'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock } from 'lucide-react'
import type { UserStatus } from '@/lib/types'

const EMOJI_PRESETS = ['😊', '🎉', '🚀', '💻', '😴', '🎮', '📚', '🏃', '🍕', '☕', '🏠', '✈️']
const DURATION_OPTIONS = ['1 hour', '24 hours', '3 days', '7 days', 'Custom days', 'Never expire']

interface UserStatusModalProps {
  isOpen: boolean
  onClose: () => void
  currentStatus?: UserStatus
  onStatusChange: (status: UserStatus) => void
}

export function UserStatusModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
}: UserStatusModalProps) {
  const [message, setMessage] = useState(currentStatus?.message || '')
  const [emoji, setEmoji] = useState(currentStatus?.emoji || '😊')
  const [duration, setDuration] = useState('24 hours')
  const [customDays, setCustomDays] = useState('1')

  const handleSave = () => {
    let expiresAt = null
    const now = new Date()

    switch (duration) {
      case '1 hour':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
        break
      case '24 hours':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case '3 days':
        expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        break
      case '7 days':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'Custom days':
        expiresAt = new Date(now.getTime() + parseInt(customDays) * 24 * 60 * 60 * 1000)
        break
      case 'Never expire':
        expiresAt = null
        break
    }

    onStatusChange({
      message,
      emoji,
      expiresAt,
      createdAt: new Date(),
    })

    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Set Status</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-6">
              {/* Emoji Selector */}
              <div>
                <label className="block text-sm font-semibold mb-3">Choose Emoji</label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_PRESETS.map((em) => (
                    <motion.button
                      key={em}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEmoji(em)}
                      className={`p-2 rounded-lg text-2xl transition-colors ${
                        emoji === em ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {em}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Status Message */}
              <div>
                <label className="block text-sm font-semibold mb-2">Status Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                  placeholder="What's on your mind?"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/100</p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expires In
                </label>
                <div className="space-y-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center p-2 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={opt}
                        checked={duration === opt}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 text-sm">{opt}</span>
                    </label>
                  ))}
                </div>

                {duration === 'Custom days' && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Days"
                    className="w-full mt-3 px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="text-sm font-semibold">{message || 'Set your status...'}</p>
                    {duration !== 'Never expire' && (
                      <p className="text-xs text-muted-foreground">Expires in {duration}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
                >
                  Save Status
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
