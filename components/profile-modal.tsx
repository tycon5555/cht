'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface ProfileModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  isEditable?: boolean
  onSave?: (user: Partial<User>) => void
}

export function ProfileModal({
  user,
  isOpen,
  onClose,
  isEditable = false,
  onSave,
}: ProfileModalProps) {
  const [formData, setFormData] = useState(user)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => {
      onSave?.(formData)
      setIsSaving(false)
      onClose()
    }, 500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Profile</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <Avatar
                  src={formData.avatar}
                  alt={formData.displayName}
                  size="lg"
                  online={formData.online}
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">@</span>
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="bg-transparent flex-1 text-foreground text-sm focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Pronouns */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pronouns</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={formData.pronouns || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pronouns: e.target.value })
                  }
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  placeholder="e.g., he/him, she/her, they/them"
                />
              </div>

              {/* About */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">About Me</label>
                <textarea
                  disabled={!isEditable}
                  value={formData.about || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none h-20"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${formData.online ? 'bg-green-500' : 'bg-muted'}`} />
                <span className="text-muted-foreground">
                  {formData.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Actions */}
            {isEditable ? (
              <div className="flex gap-2 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium mt-6"
              >
                Close
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
