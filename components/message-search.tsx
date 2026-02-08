'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter, MessageCircle, Image as ImageIcon, Music, Link2, PieChart } from 'lucide-react'
import type { Message } from '@/lib/types'

interface MessageSearchProps {
  messages: Message[]
  onSelectMessage?: (messageId: string) => void
}

type FilterType = 'all' | 'text' | 'media' | 'links' | 'voice' | 'polls'

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: MessageCircle },
  { id: 'text', label: 'Text', icon: MessageCircle },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'voice', label: 'Voice', icon: Music },
  { id: 'polls', label: 'Polls', icon: PieChart },
] as const

export function MessageSearch({ messages, onSelectMessage }: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showResults, setShowResults] = useState(false)

  const filteredMessages = messages.filter((msg) => {
    let typeMatch = true
    if (activeFilter === 'text') typeMatch = msg.type === 'text'
    if (activeFilter === 'media') typeMatch = msg.type === 'image'
    if (activeFilter === 'voice') typeMatch = msg.type === 'voice'
    if (activeFilter === 'links') typeMatch = msg.content.includes('http')
    if (activeFilter === 'polls') typeMatch = msg.type === 'poll'

    const contentMatch =
      msg.content.toLowerCase().includes(query.toLowerCase()) || !query

    return typeMatch && contentMatch
  })

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mt-3 overflow-x-auto pb-2"
      >
        {FILTER_OPTIONS.map((filter) => {
          const Icon = filter.icon as any
          return (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {showResults && query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-40"
          >
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.slice(0, 10).map((msg, idx) => (
                  <motion.button
                    key={msg.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      onSelectMessage?.(msg.id)
                      setShowResults(false)
                    }}
                    className="w-full p-3 text-left border-b border-border last:border-b-0 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {msg.type === 'text' && <MessageCircle className="w-4 h-4 text-primary" />}
                        {msg.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                        {msg.type === 'voice' && <Music className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {msg.content.substring(0, 50)}
                          {msg.content.length > 50 ? '...' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {filteredMessages.length > 10 && (
                  <div className="p-3 text-center border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      +{filteredMessages.length - 10} more results
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
