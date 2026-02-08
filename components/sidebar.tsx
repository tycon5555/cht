'use client'

import { useState } from 'react'
import { Search, Plus, MoreVertical, Archive } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import { ChatListItem } from './chat-list-item'
import type { Chat, User } from '@/lib/types'

interface SidebarProps {
  currentUser: User
  chats: Chat[]
  activeChatId: string | null
  onChatSelect: (chatId: string) => void
  onUnlockHidden: (password: string) => void
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

  const handleHiddenSearch = () => {
    if (searchQuery === 'secret123') {
      const hiddenChats = chats.filter((c) => c.hidden)
      // Show hidden chats temporarily
      console.log('[v0] Hidden chats unlocked:', hiddenChats)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Profile & Title */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messenger</h1>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-muted rounded-full"
            >
              <Plus className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-muted rounded-full"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-input rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats or unlock hidden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHiddenSearch()}
            className="bg-transparent flex-1 text-sm focus:outline-none text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Profile Preview */}
      <div className="px-4 py-3 border-b border-border">
        <button className="flex items-center gap-3 w-full hover:bg-muted p-2 rounded-lg transition-colors">
          <Avatar
            src={currentUser.avatar}
            alt={currentUser.displayName}
            size="md"
            online={currentUser.online}
          />
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-sm">{currentUser.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{currentUser.username}</p>
          </div>
          {totalUnread > 0 && (
            <div className="bg-destructive text-destructive rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalUnread}
            </div>
          )}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No chats found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                onClick={() => onChatSelect(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Section */}
      {archivedChats.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Archive className="w-4 h-4" />
            Archived ({archivedChats.length})
          </button>
          {showArchived && (
            <div className="px-2 pb-2">
              {archivedChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onClick={() => onChatSelect(chat.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
