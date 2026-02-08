'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onAddFriend: (user: User) => void
  allUsers: User[]
}

export function AddFriendModal({
  isOpen,
  onClose,
  onAddFriend,
  allUsers,
}: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  const filteredUsers = allUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = (user: User) => {
    if (!user.username.trim()) {
      setError('Invalid username')
      return
    }
    onAddFriend(user)
    setSearchQuery('')
    setError('')
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
              <h2 className="text-xl font-bold">Add Friend</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setError('')
                }}
                className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No users found' : 'Enter a username to search'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.button
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAdd(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar
                      src={user.avatar}
                      alt={user.displayName}
                      size="sm"
                      online={user.online}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-full hover:bg-primary/10 text-primary"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border mt-6 pt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
