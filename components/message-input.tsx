'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, Smile, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { StickerPicker } from './sticker-picker'
import { VisibilitySelector } from './visibility-selector'
import type { MessageVisibility, Sticker } from '@/lib/types'

interface MessageInputProps {
  onSend: (message: string) => void
  onImageUpload?: (file: File) => void
  onVoiceRecord?: (duration: number) => void
  onStickerSelect?: (sticker: Sticker) => void
  isRecording?: boolean
  customStickers?: Sticker[]
}

export function MessageInput({
  onSend,
  onImageUpload,
  onVoiceRecord,
  onStickerSelect,
  customStickers = [],
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [visibility, setVisibility] = useState<MessageVisibility>('forever')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingStartRef = useRef<number>(0)

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImageUpload) {
      onImageUpload(file)
    }
  }

  const handleVoiceClick = () => {
    if (isRecording) {
      const duration = Date.now() - recordingStartRef.current
      setIsRecording(false)
      if (onVoiceRecord) {
        onVoiceRecord(duration)
      }
    } else {
      recordingStartRef.current = Date.now()
      setIsRecording(true)
    }
  }

  return (
    <>
      <div className="border-t border-border/50 px-4 py-3 bg-card/70">
        <div className="flex items-end gap-2">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={handleImageClick}
            title="Attach image"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setShowStickers(!showStickers)}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message #general"
              className="flex-1 bg-input text-foreground placeholder-muted-foreground border border-border/50 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              rows={1}
            />
          </div>

          {message.trim() ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceClick}
              className={`p-2 rounded-full ${
                isRecording
                  ? 'bg-destructive text-destructive animate-pulse'
                  : 'text-primary hover:bg-primary/10'
              }`}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <StickerPicker
        isOpen={showStickers}
        onClose={() => setShowStickers(false)}
        onSelectSticker={(sticker) => {
          onStickerSelect?.(sticker)
          setShowStickers(false)
        }}
        customStickers={customStickers}
      />
    </>
  )
}
