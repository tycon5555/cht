'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, AlertTriangle, Ban, UserPlus, Clock, CheckCircle } from 'lucide-react'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface UserProfileViewProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onMessage?: () => void
  onBlock?: () => void
  onReport?: () => void
  isBlocked?: boolean
  isFriend?: boolean
}

export function UserProfileView({
  user,
  isOpen,
  onClose,
  onMessage,
  onBlock,
  onReport,
  isBlocked = false,
  isFriend = false,
}: UserProfileViewProps) {
  const [showActions, setShowActions] = useState(false)

  if (!user) return null

  const formatDate = (date?: Date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl overflow-hidden w-full max-w-md shadow-2xl"
          >
            {/* Header Background */}
            <div className="h-24 bg-gradient-to-r from-primary to-secondary relative">
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="flex justify-center -mt-16 mb-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="border-4 border-card rounded-full"
                >
                  <Avatar src={user.avatar} alt={user.displayName} size="lg" />
                </motion.div>
              </div>

              {/* User Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{user.displayName}</h2>
                  {user.verification?.phoneVerified || user.verification?.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" title="Verified" />
                  ) : null}
                </div>
                <p className="text-muted-foreground">@{user.username}</p>

                {/* Status */}
                {user.status && (
                  <div className="mt-2 p-2 bg-muted rounded-lg inline-block">
                    <p className="text-sm">
                      <span className="text-lg">{user.status.emoji}</span> {user.status.message}
                    </p>
                    {user.status.expiresAt && (
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Expires {formatDate(user.status.expiresAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Online Status */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-muted'}`}></div>
                  <p className="text-xs text-muted-foreground">
                    {user.online ? 'Active now' : `Last seen ${user.lastSeen || 'recently'}`}
                  </p>
                </div>
              </motion.div>

              {/* Pronouns & About */}
              {(user.pronouns || user.about) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3 mb-6 p-4 bg-muted rounded-lg"
                >
                  {user.pronouns && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Pronouns</p>
                      <p className="text-sm">{user.pronouns}</p>
                    </div>
                  )}
                  {user.about && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">About</p>
                      <p className="text-sm">{user.about}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Verification Info */}
              {user.verification && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-700">Account Verified</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {user.verification.phoneVerified && 'Phone • '}
                        {user.verification.emailVerified && 'Email'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                {!isBlocked && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onMessage?.()
                      onClose()
                    }}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </motion.button>
                )}

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowActions(!showActions)
                    }}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    {showActions ? 'Hide Options' : 'More Options'}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {isBlocked ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onBlock?.()
                            onClose()
                          }}
                          className="w-full py-2 border border-primary/30 text-primary hover:bg-primary/5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Unblock
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onBlock?.()
                            onClose()
                          }}
                          className="w-full py-2 border border-destructive/30 text-destructive hover:bg-destructive/5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Ban className="w-4 h-4" />
                          Block User
                        </motion.button>
                      )}

                      {!isBlocked && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onReport?.()
                            onClose()
                          }}
                          className="w-full py-2 border border-orange-500/30 text-orange-600 hover:bg-orange-500/5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Report User
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
