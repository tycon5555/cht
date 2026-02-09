'use client'

import { useState } from 'react'
import { Search, Plus, Settings, MoreVertical, Archive } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import { ChatListItem } from './chat-list-item'
import type { Chat, User } from '@/lib/types'

interface SidebarProps {
  currentUser: User
  chats: Chat[]
  activeChatId: string | null
  onChatSelect: (chatId: string) => void
  onUnlockHidden?: () => void
}

export function Sidebar({
  currentUser,
  chats,
  activeChatId,
  onChatSelect,
  onUnlockHidden,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const activeChats = chats.filter((c) => !c.archived && !c.hidden)
  const archivedChats = chats.filter((c) => c.archived)
  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)

  const filteredChats = activeChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header - Discord Style */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">#</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 text-primary" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-input border border-border/50 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Chats */}
        {filteredChats.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChatListItem
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => onChatSelect(chat.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No active conversations'}
          </div>
        )}

        {/* Archived Chats */}
        {archivedChats.length > 0 && (
          <div className="border-t border-border/50 p-2">
            <motion.button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archived ({archivedChats.length})</span>
            </motion.button>

            {showArchived && (
              <div className="space-y-1 mt-2">
                {archivedChats.map((chat) => (
                  <motion.div key={chat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ChatListItem
                      chat={chat}
                      isActive={activeChatId === chat.id}
                      onSelect={() => onChatSelect(chat.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - User Profile */}
      <div className="border-t border-border/50 p-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <Avatar
            src={currentUser.avatar}
            alt={currentUser.displayName}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentUser.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{currentUser.username}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
