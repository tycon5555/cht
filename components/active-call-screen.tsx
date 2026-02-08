'use client'

import { useState, useEffect } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface ActiveCallScreenProps {
  type: 'voice' | 'video'
  recipientUser: User
  currentUser: User
  onEndCall: () => void
  isGroupCall?: boolean
  participants?: User[]
}

export function ActiveCallScreen({
  type,
  recipientUser,
  currentUser,
  onEndCall,
  isGroupCall = false,
  participants = [],
}: ActiveCallScreenProps) {
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (type === 'video') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {/* Main Remote Video Area */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Remote Video Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <Avatar
                  src={recipientUser.avatar}
                  alt={recipientUser.displayName}
                  size="lg"
                />
                <p className="text-white mt-4 text-lg font-semibold">{recipientUser.displayName}</p>
              </div>
            </div>

            {/* Local Video Preview (draggable) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              drag
              dragConstraints={{
                left: -window.innerWidth / 2,
                right: window.innerWidth / 2,
                top: -window.innerHeight / 2,
                bottom: window.innerHeight / 2,
              }}
              className="absolute bottom-6 right-6 w-32 h-40 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-2xl border-2 border-white/20 overflow-hidden cursor-move shadow-2xl"
            >
              <div className="w-full h-full flex items-center justify-center">
                {isCameraOff ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <Avatar
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    size="lg"
                  />
                )}
              </div>
            </motion.div>

            {/* Call Duration */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-1/2 transform -translate-x-1/2 text-white text-lg font-mono"
            >
              {formatDuration(duration)}
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700/50 hover:bg-gray-600'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isCameraOff
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700/50 hover:bg-gray-600'
                }`}
              >
                {isCameraOff ? (
                  <VideoOff className="w-5 h-5 text-white" />
                ) : (
                  <Video className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEndCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </motion.button>
            </motion.div>

            {/* Participants Grid (Group Calls) */}
            {isGroupCall && participants.length > 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowParticipants(!showParticipants)}
                className="absolute top-6 right-6 bg-gray-700/50 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                {participants.length} Participants
              </motion.button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Voice Call Screen
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary/20 to-secondary/20 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Avatar */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8"
        >
          <Avatar
            src={recipientUser.avatar}
            alt={recipientUser.displayName}
            size="lg"
          />
        </motion.div>

        {/* Name & Duration */}
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {recipientUser.displayName}
        </h2>
        <p className="text-lg text-muted-foreground font-mono mb-8">
          {formatDuration(duration)}
        </p>

        {/* Controls */}
        <div className="flex gap-6 justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
