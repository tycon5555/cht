'use client'

import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { MessageVisibility } from '@/lib/types'

interface VisibilitySelectorProps {
  selected: MessageVisibility
  onSelect: (visibility: MessageVisibility) => void
}

const visibilityOptions = [
  {
    id: 'forever' as const,
    label: 'Forever',
    description: 'Always visible',
    icon: Eye,
  },
  {
    id: 'view_once' as const,
    label: 'View Once',
    description: 'Disappears after viewing',
    icon: EyeOff,
  },
  {
    id: 'view_twice' as const,
    label: 'View Twice',
    description: 'Disappears after 2 views',
    icon: Eye,
  },
]

export function VisibilitySelector({
  selected,
  onSelect,
}: VisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = visibilityOptions.find((o) => o.id === selected)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-muted rounded-full"
        title="Message visibility"
      >
        <Eye className="w-5 h-5 text-primary" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden w-56 z-50"
          >
            {visibilityOptions.map((option) => {
              const Icon = option.icon
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                  onClick={() => {
                    onSelect(option.id)
                    setIsOpen(false)
                  }}
                  className={`w-full p-3 text-left transition-colors flex items-start gap-3 ${
                    selected === option.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    selected === option.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      selected === option.id ? 'text-primary' : 'text-foreground'
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
