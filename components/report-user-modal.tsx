'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface ReportUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, description: string, blockAfterReport: boolean) => void
  user: User | null
}

export function ReportUserModal({ isOpen, onClose, onConfirm, user }: ReportUserModalProps) {
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [blockAfterReport, setBlockAfterReport] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !user) return null

  const reasons = [
    { value: 'spam', label: 'Spam', description: 'Unwanted commercial content' },
    { value: 'harassment', label: 'Harassment', description: 'Rude or abusive messages' },
    { value: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive or explicit content' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'other', label: 'Other', description: 'Something else not listed' },
  ]

  const handleSubmit = () => {
    if (!reason) return
    
    setIsSubmitting(true)
    onConfirm(reason, description, blockAfterReport)
    
    setTimeout(() => {
      setIsSubmitting(false)
      setReason('spam')
      setDescription('')
      setBlockAfterReport(false)
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
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Report User</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 bg-input rounded-lg">
          <Avatar src={user.avatar} alt={user.displayName} size="md" />
          <div>
            <p className="font-medium text-foreground">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <label className="block mb-4">
          <p className="text-sm font-medium text-foreground mb-2">Reason for Report</p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <label key={r.value} className="flex items-start gap-3 p-2 cursor-pointer rounded-lg hover:bg-input transition-colors">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="w-4 h-4 mt-1 accent-primary flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
        </label>

        <label className="block mb-4">
          <p className="text-sm font-medium text-foreground mb-2">Additional Details (Optional)</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened..."
            className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary h-24"
          />
          <p className="text-xs text-muted-foreground mt-1">{description.length}/500</p>
        </label>

        <label className="flex items-center gap-3 p-3 mb-6 bg-input rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={blockAfterReport}
            onChange={(e) => setBlockAfterReport(e.target.checked)}
            className="w-4 h-4 accent-primary rounded"
          />
          <span className="text-sm text-foreground">Block user after reporting</span>
        </label>

        <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            ℹ️ Our moderation team will review this report and take appropriate action.
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
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground rounded-lg transition-colors font-medium"
          >
            {isSubmitting ? 'Reporting...' : 'Report'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
