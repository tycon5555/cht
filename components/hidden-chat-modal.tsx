'use client'

import { useState } from 'react'
import { Lock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HiddenChatModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: (password: string) => void
  error?: string
}

export function HiddenChatModal({
  isOpen,
  onClose,
  onUnlock,
  error,
}: HiddenChatModalProps) {
  const [password, setPassword] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUnlock(password)
    if (error) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    } else {
      setPassword('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
            transition={isShaking ? { duration: 0.5 } : {}}
            className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Hidden Chats</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Enter the password to unlock hidden chats
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className={`w-full bg-input text-foreground border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-destructive focus:ring-destructive'
                      : 'border-border focus:ring-primary'
                  }`}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-destructive mt-2">{error}</p>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!password.trim()}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  Unlock
                </motion.button>
              </div>
            </form>

            {/* Close Button */}
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Hint */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Tip: Try typing <span className="font-mono text-primary">'secret123'</span>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
