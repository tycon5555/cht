'use client'

import { useState } from 'react'
import { UserPlus, Users, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from './avatar'
import type { User } from '@/lib/types'

interface FriendsListProps {
  friends: User[]
  onAddFriend?: () => void
  onMessage?: (userId: string) => void
}

export function FriendsList({ friends, onAddFriend, onMessage }: FriendsListProps) {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const onlineFriends = friends.filter((f) => f.online)
  const offlineFriends = friends.filter((f) => !f.online)

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Friends
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddFriend}
            className="p-2 hover:bg-muted rounded-full"
          >
            <UserPlus className="w-5 h-5 text-primary" />
          </motion.button>
        </div>
      </div>

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="border-b border-border">
          <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Online ({onlineFriends.length})
          </h3>
          <div className="px-2">
            {onlineFriends.map((friend) => (
              <motion.button
                key={friend.id}
                onClick={() => setSelectedFriend(friend.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  selectedFriend === friend.id ? 'bg-accent bg-opacity-20' : 'hover:bg-muted'
                }`}
              >
                <Avatar
                  src={friend.avatar}
                  alt={friend.displayName}
                  size="sm"
                  online={friend.online}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{friend.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMessage?.(friend.id)
                  }}
                  className="p-1 hover:bg-primary/10 rounded text-primary"
                >
                  <MessageSquare className="w-4 h-4" />
                </motion.button>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Offline Friends */}
      {offlineFriends.length > 0 && (
        <div>
          <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Offline ({offlineFriends.length})
          </h3>
          <div className="px-2">
            {offlineFriends.map((friend) => (
              <motion.button
                key={friend.id}
                onClick={() => setSelectedFriend(friend.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  selectedFriend === friend.id ? 'bg-accent bg-opacity-20' : 'hover:bg-muted'
                }`}
              >
                <Avatar
                  src={friend.avatar}
                  alt={friend.displayName}
                  size="sm"
                  online={friend.online}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{friend.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMessage?.(friend.id)
                  }}
                  className="p-1 hover:bg-primary/10 rounded text-primary opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                </motion.button>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {friends.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No friends yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddFriend}
              className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90"
            >
              Add Friends
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
