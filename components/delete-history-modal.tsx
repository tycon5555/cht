'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'

interface DeleteHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (type: 'all' | 'older_than', duration?: string) => void
  chatName: string
}

export function DeleteHistoryModal({ isOpen, onClose, onConfirm, chatName }: DeleteHistoryModalProps) {
  const [deleteType, setDeleteType] = useState<'all' | 'older_than'>('all')
  const [duration, setDuration] = useState('24h')
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    setIsDeleting(true)
    onConfirm(deleteType, deleteType === 'older_than' ? duration : undefined)
    setTimeout(() => {
      setIsDeleting(false)
      onClose()
    }, 500)
  }

  const durationOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom date' },
  ]

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
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Delete Chat History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Choose how much of your conversation with <span className="font-semibold text-foreground">{chatName}</span> to delete.
        </p>

        {/* Delete Type Selection */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-input transition-colors">
            <input
              type="radio"
              name="deleteType"
              value="all"
              checked={deleteType === 'all'}
              onChange={() => setDeleteType('all')}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Delete all messages</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-input transition-colors">
            <input
              type="radio"
              name="deleteType"
              value="older_than"
              checked={deleteType === 'older_than'}
              onChange={() => setDeleteType('older_than')}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Delete messages older than</span>
          </label>
        </div>

        {/* Duration Selection */}
        {deleteType === 'older_than' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-3 bg-input rounded-lg space-y-2"
          >
            {durationOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={opt.value}
                  checked={duration === opt.value}
                  onChange={() => setDuration(opt.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">{opt.label}</span>
              </label>
            ))}
          </motion.div>
        )}

        {/* Warning */}
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive">
            ⚠️ Deleted messages cannot be recovered. This action cannot be undone.
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
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground rounded-lg transition-colors font-medium"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
