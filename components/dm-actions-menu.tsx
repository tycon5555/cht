'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Eye, Lock, AlertCircle, Archive } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Chat } from '@/lib/types'

interface DmActionsMenuProps {
  chat: Chat
  isClosed?: boolean
  onClose?: () => void
  onDelete?: () => void
  onDisappearing?: () => void
  onBlock?: () => void
  onReport?: () => void
  onArchive?: () => void
}

export function DmActionsMenu({
  chat,
  isClosed = false,
  onClose,
  onDelete,
  onDisappearing,
  onBlock,
  onReport,
  onArchive,
}: DmActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)

  const menuItems = [
    { icon: Archive, label: 'Archive Chat', onClick: onArchive, color: 'text-muted-foreground' },
    { icon: Eye, label: 'Disappearing Messages', onClick: onDisappearing, color: 'text-muted-foreground' },
    { icon: Trash2, label: 'Delete Chat History', onClick: onDelete, color: 'text-muted-foreground' },
    { icon: Lock, label: isClosed ? 'Reopen Chat' : 'Close Chat', onClick: onClose, color: isClosed ? 'text-primary' : 'text-destructive' },
    { icon: AlertCircle, label: 'Block User', onClick: onBlock, color: 'text-destructive' },
    { icon: AlertCircle, label: 'Report User', onClick: onReport, color: 'text-destructive' },
  ]

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-input rounded-lg text-muted-foreground transition-colors"
        title="More options"
      >
        <MoreVertical className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {menuItems.map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ backgroundColor: 'var(--color-input)' }}
                onClick={() => {
                  item.onClick?.()
                  setShowMenu(false)
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-sm hover:bg-input transition-colors border-b border-border last:border-b-0 ${item.color}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-foreground">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
