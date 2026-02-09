'use client'

import { useState } from 'react'
import { UserPlus, Users, MessageCircle, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface FriendsListProps {
  friends: User[]
  onAddFriend?: () => void
  onMessage?: (userId: string) => void
}

export function FriendsList({ friends, onAddFriend, onMessage }: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFriends = friends.filter((f) =>
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineFriends = filteredFriends.filter((f) => f.online)
  const offlineFriends = filteredFriends.filter((f) => !f.online)

  return (
    <div className="h-full border-l border-border/50 bg-card flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Friends</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddFriend}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            title="Add friend"
          >
            <UserPlus className="w-4 h-4 text-primary" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-input border border-border/50 rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <div>
            <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              ONLINE ({onlineFriends.length})
            </h3>
            <div className="space-y-1 px-2">
              {onlineFriends.map((friend) => (
                <FriendItem key={friend.id} friend={friend} onMessage={onMessage} />
              ))}
            </div>
          </div>
        )}

        {/* Offline Friends */}
        {offlineFriends.length > 0 && (
          <div>
            <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              OFFLINE ({offlineFriends.length})
            </h3>
            <div className="space-y-1 px-2 opacity-60">
              {offlineFriends.map((friend) => (
                <FriendItem key={friend.id} friend={friend} onMessage={onMessage} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {friends.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Users className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No friends yet</p>
          </div>
        )}
      </div>

    </div>
  )
}

function FriendItem({ friend, onMessage }: { friend: User; onMessage?: (userId: string) => void }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      <div className="relative flex-shrink-0">
        <Avatar src={friend.avatar} alt={friend.displayName} size="sm" />
        {friend.online && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{friend.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onMessage?.(friend.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/20 rounded transition-all"
        title="Send message"
      >
        <MessageCircle className="w-4 h-4 text-primary" />
      </motion.button>
    </motion.div>
  )
}
