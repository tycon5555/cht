'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

interface VideoCallProps {
  roomName: string
  participantName: string
  isInitiator: boolean
  onEndCall: () => void
  onError?: (error: string) => void
}

export function VideoCall({
  roomName,
  participantName,
  isInitiator,
  onEndCall,
  onError,
}: VideoCallProps) {
  const [token, setToken] = useState<string | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [participants, setParticipants] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const getToken = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/video-calls/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            participantName,
            identity: `user_${Date.now()}`,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get video token')
        }

        const data = await response.json()
        setToken(data.token)
        setParticipants([participantName])

        console.log('[v0] Video token received for room:', roomName)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        onError?.(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    getToken()

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [roomName, participantName, onError])

  useEffect(() => {
    // Start call duration timer
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }
    onEndCall()
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4">
        <div className="text-destructive text-lg">{error}</div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEndCall}
          className="px-6 py-3 bg-destructive text-white rounded-lg font-medium"
        >
          End Call
        </motion.button>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Remote Video Background */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          muted={false}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Call Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10"
      >
        <div>
          <h2 className="text-white text-xl font-bold">{participantName}</h2>
          <p className="text-slate-300 text-sm">Call duration: {formatDuration(callDuration)}</p>
        </div>
        <div className="text-slate-300 text-sm">Room: {roomName}</div>
      </motion.div>

      {/* Local Video Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-6 right-6 w-48 h-48 rounded-xl overflow-hidden border-4 border-primary shadow-2xl"
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/30" />
      </motion.div>

      {/* Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-slate-900 to-transparent"
      >
        {/* Audio Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={`p-4 rounded-full transition-all ${
            isAudioEnabled
              ? 'bg-primary text-primary-foreground'
              : 'bg-destructive text-white'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </motion.button>

        {/* Video Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsVideoEnabled(!isVideoEnabled)}
          className={`p-4 rounded-full transition-all ${
            isVideoEnabled
              ? 'bg-primary text-primary-foreground'
              : 'bg-destructive text-white'
          }`}
          title={isVideoEnabled ? 'Stop Camera' : 'Start Camera'}
        >
          {isVideoEnabled ? (
            <Video className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          title="Call settings"
        >
          <Settings className="w-6 h-6" />
        </motion.button>

        {/* End Call */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEndCall}
          className="p-4 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
          title="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Participants */}
      {participants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 right-6 bg-slate-800/90 backdrop-blur rounded-lg p-4 z-10"
        >
          <p className="text-slate-300 text-sm font-medium mb-3">Participants ({participants.length})</p>
          <div className="space-y-2">
            {participants.map((participant, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-slate-100 text-sm">{participant}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
