'use client'

import { Phone, PhoneOff, Video } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface IncomingCallModalProps {
  isOpen: boolean
  caller: User | null
  type: 'voice' | 'video'
  onAccept: () => void
  onReject: () => void
}

export function IncomingCallModal({
  isOpen,
  caller,
  type,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && caller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-b from-card to-background rounded-3xl p-8 w-full max-w-md shadow-2xl text-center"
          >
            {/* Caller Avatar */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <Avatar
                src={caller.avatar}
                alt={caller.displayName}
                size="lg"
                online={caller.online}
              />
            </motion.div>

            {/* Call Type & Info */}
            <h2 className="text-2xl font-bold mb-2">{caller.displayName}</h2>
            <p className="text-muted-foreground mb-8">
              {type === 'voice' ? 'Incoming voice call' : 'Incoming video call'}
            </p>

            {/* Call Icon Indicator */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-8"
            >
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
              }`}>
                {type === 'video' ? (
                  <Video className={`w-8 h-8 ${type === 'video' ? 'text-blue-500' : 'text-green-500'}`} />
                ) : (
                  <Phone className="w-8 h-8 text-green-500" />
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReject}
                className="flex-1 bg-destructive text-destructive hover:bg-destructive/90 rounded-full p-4 flex items-center justify-center transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className={`flex-1 rounded-full p-4 flex items-center justify-center transition-colors ${
                  type === 'video'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
