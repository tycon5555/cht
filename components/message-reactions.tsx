'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmilePlus, X } from 'lucide-react'
import type { MessageReaction } from '@/lib/types'

interface MessageReactionsProps {
  reactions: MessageReaction[]
  onAddReaction?: (emoji: string) => void
  onRemoveReaction?: (emoji: string) => void
  currentUserId?: string
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👌']

export function MessageReactions({
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  const handleReactionClick = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji)
    if (reaction?.users.includes(currentUserId || '')) {
      onRemoveReaction?.(emoji)
    } else {
      onAddReaction?.(emoji)
    }
  }

  return (
    <div className="relative flex flex-wrap gap-2 items-center mt-2">
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <motion.button
          key={reaction.emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
          onMouseLeave={() => setHoveredEmoji(null)}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={`px-2 py-1 rounded-full text-sm font-medium transition-colors ${
            reaction.users.includes(currentUserId || '')
              ? 'bg-primary/20 border border-primary'
              : 'bg-muted hover:bg-muted/80 border border-border'
          }`}
        >
          <span className="mr-1">{reaction.emoji}</span>
          {reaction.count}
        </motion.button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full hover:bg-muted border border-border transition-colors"
        >
          <SmilePlus className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-lg shadow-lg p-2 z-40"
            >
              <div className="grid grid-cols-4 gap-2">
                {QUICK_REACTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      handleReactionClick(emoji)
                      setShowPicker(false)
                    }}
                    className="text-2xl p-2 hover:bg-muted rounded transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reaction Details Tooltip */}
      <AnimatePresence>
        {hoveredEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-8 left-0 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50"
          >
            {reactions.find((r) => r.emoji === hoveredEmoji)?.users.join(', ')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
