'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Sticker } from '@/lib/types'

interface StickerPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectSticker: (sticker: Sticker) => void
  customStickers: Sticker[]
}

const DEFAULT_STICKERS: Sticker[] = [
  { id: 'sticker_1', url: '😀', category: 'faces', custom: false },
  { id: 'sticker_2', url: '😂', category: 'faces', custom: false },
  { id: 'sticker_3', url: '😍', category: 'faces', custom: false },
  { id: 'sticker_4', url: '🎉', category: 'celebrations', custom: false },
  { id: 'sticker_5', url: '🎊', category: 'celebrations', custom: false },
  { id: 'sticker_6', url: '❤️', category: 'hearts', custom: false },
  { id: 'sticker_7', url: '💯', category: 'gestures', custom: false },
  { id: 'sticker_8', url: '🔥', category: 'fire', custom: false },
  { id: 'sticker_9', url: '⚡', category: 'energy', custom: false },
  { id: 'sticker_10', url: '👍', category: 'gestures', custom: false },
]

export function StickerPicker({
  isOpen,
  onClose,
  onSelectSticker,
  customStickers,
}: StickerPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const allStickers = [...DEFAULT_STICKERS, ...customStickers]
  const categories = Array.from(new Set(allStickers.map((s) => s.category)))
  const filtered = selectedCategory
    ? allStickers.filter((s) => s.category === selectedCategory)
    : allStickers

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Stickers</h3>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All
              </motion.button>
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {filtered.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onSelectSticker(sticker)
                    onClose()
                  }}
                  className="aspect-square flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-4xl"
                >
                  {sticker.url}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Create Custom Sticker
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
