'use client'

import { useState, useEffect } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface ActiveCallScreenProps {
  participant: User | null
  callType: 'voice' | 'video'
  onEndCall: () => void
  isMuted?: boolean
  isVideoOn?: boolean
  onMuteToggle?: () => void
  onVideoToggle?: () => void
}

export function ActiveCallScreen({
  participant,
  callType,
  onEndCall,
  isMuted = false,
  isVideoOn = true,
  onMuteToggle,
  onVideoToggle,
}: ActiveCallScreenProps) {
  const [duration, setDuration] = useState(0)
  const [localMuted, setLocalMuted] = useState(isMuted)
  const [localVideoOn, setLocalVideoOn] = useState(isVideoOn)

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

  if (callType === 'video') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {/* Main Remote Video Area */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Remote Video Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center">
                  {participant?.avatar && (
                    <img src={participant.avatar} alt={participant.displayName} className="w-full h-full object-cover rounded-full" />
                  )}
                </div>
                <p className="text-white mt-4 text-lg font-semibold">{participant?.displayName || 'Caller'}</p>
              </div>
            </div>

            {/* Local Video Preview (draggable) */}
            {localVideoOn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-6 right-6 w-32 h-40 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
              >
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <Video className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-xs text-white">Your camera</p>
                  </div>
                </div>
              </motion.div>
            )}

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
                onClick={() => {
                  setLocalMuted(!localMuted)
                  onMuteToggle?.()
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  localMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700/50 hover:bg-gray-600'
                }`}
              >
                {localMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLocalVideoOn(!localVideoOn)
                  onVideoToggle?.()
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !localVideoOn
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700/50 hover:bg-gray-600'
                }`}
              >
                {!localVideoOn ? (
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
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center overflow-hidden">
            {participant?.avatar && (
              <img src={participant.avatar} alt={participant?.displayName} className="w-full h-full object-cover" />
            )}
          </div>
        </motion.div>

        {/* Name & Duration */}
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {participant?.displayName || 'Caller'}
        </h2>
        <p className="text-lg text-muted-foreground font-mono mb-8">
          {formatDuration(duration)}
        </p>

        {/* Controls */}
        <div className="flex gap-6 justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLocalMuted(!localMuted)
              onMuteToggle?.()
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              localMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {localMuted ? (
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
