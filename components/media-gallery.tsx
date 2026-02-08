'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon, Music, File, Link2, PieChart } from 'lucide-react'
import type { Message } from '@/lib/types'

interface MediaGalleryProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
}

type TabType = 'photos' | 'videos' | 'files' | 'links' | 'voice' | 'polls'

export function MediaGallery({ isOpen, onClose, messages }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('photos')

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'videos', label: 'Videos', icon: ImageIcon },
    { id: 'files', label: 'Files', icon: File },
    { id: 'links', label: 'Links', icon: Link2 },
    { id: 'voice', label: 'Voice', icon: Music },
    { id: 'polls', label: 'Polls', icon: PieChart },
  ]

  const getFilteredMessages = () => {
    switch (activeTab) {
      case 'photos':
        return messages.filter((m) => m.type === 'image')
      case 'voice':
        return messages.filter((m) => m.type === 'voice')
      case 'polls':
        return messages.filter((m) => m.type === 'poll')
      case 'links':
        return messages.filter((m) => m.content.includes('http'))
      default:
        return []
    }
  }

  const filteredMessages = getFilteredMessages()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold">Media Gallery</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">No {activeTab} found</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMessages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="aspect-square bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer group"
                    >
                      {msg.type === 'image' && msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          alt="Media"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {msg.type === 'voice' && <Music className="w-8 h-8 text-muted-foreground" />}
                          {msg.type === 'poll' && <PieChart className="w-8 h-8 text-muted-foreground" />}
                          {msg.content.includes('http') && <Link2 className="w-8 h-8 text-muted-foreground" />}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
