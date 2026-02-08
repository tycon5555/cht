'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock } from 'lucide-react'
import type { Poll } from '@/lib/types'

interface PollComponentProps {
  poll: Poll
  currentUserId: string
  onVote?: (pollId: string, optionId: string) => void
  isEnded?: boolean
}

export function PollComponent({
  poll,
  currentUserId,
  onVote,
  isEnded,
}: PollComponentProps) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)
  const userVoted = poll.voters[currentUserId]?.length > 0

  const calculatePercentage = (votes: number) => {
    return totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
  }

  return (
    <div className="w-full bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Poll Question */}
      <div>
        <p className="font-semibold text-sm">{poll.question}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {poll.anonymous && <span>Anonymous poll</span>}
          {poll.multipleVotes && <span>Multiple votes allowed</span>}
          {poll.expiresAt && (
            <>
              <Clock className="w-3 h-3" />
              <span>Expires {new Date(poll.expiresAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = calculatePercentage(option.votes)
          const userSelectedThis = poll.voters[currentUserId]?.includes(option.id)

          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isEnded && onVote?.(poll.id, option.id)}
              disabled={isEnded}
              className="w-full text-left relative overflow-hidden rounded-lg border border-border hover:border-primary transition-colors group"
            >
              {/* Background Progress Bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`absolute inset-y-0 left-0 ${
                  userSelectedThis ? 'bg-primary/30' : 'bg-primary/10'
                }`}
              />

              {/* Content */}
              <div className="relative p-3 flex items-center justify-between">
                <span className="font-medium text-sm">{option.text}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{percentage}%</span>
                  {userSelectedThis && (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Vote Count */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          {userVoted && ' • You voted'}
        </p>
      </div>
    </div>
  )
}
