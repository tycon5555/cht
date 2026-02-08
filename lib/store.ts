'use client'

import { create } from 'zustand'
import type { User, Chat, Message, FriendRequest, CallState, Sticker } from './types'

interface AppStore {
  // User state
  currentUser: User | null
  setCurrentUser: (user: User) => void
  
  // Chat state
  chats: Chat[]
  activeChatId: string | null
  setActiveChatId: (chatId: string) => void
  addChat: (chat: Chat) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  archiveChat: (chatId: string) => void
  unarchiveChat: (chatId: string) => void
  hideChat: (chatId: string, password: string) => void
  unhideChat: (chatId: string) => void
  
  // Message state
  addMessage: (chatId: string, message: Message) => void
  updateMessageStatus: (chatId: string, messageId: string, status: Message['status']) => void
  setTypingUsers: (chatId: string, userIds: string[]) => void
  
  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  
  // Friend state
  friends: User[]
  friendRequests: FriendRequest[]
  addFriend: (user: User) => void
  removeFriend: (userId: string) => void
  sendFriendRequest: (fromUser: User, toUser: User) => void
  acceptFriendRequest: (requestId: string) => void
  rejectFriendRequest: (requestId: string) => void
  
  // Call state
  call: CallState | null
  initiateCall: (type: 'voice' | 'video', recipient: User) => void
  endCall: () => void
  
  // Settings
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  
  // Stickers
  customStickers: Sticker[]
  addCustomSticker: (sticker: Sticker) => void
  removeCustomSticker: (stickerId: string) => void
  
  // Notifications
  notifications: Array<{ id: string; username: string; message: string; type: string }>
  addNotification: (notification: { username: string; message: string; type: string }) => void
  clearNotifications: () => void
  
  // Unread counter
  totalUnread: number
  updateUnreadCount: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  chats: [],
  activeChatId: null,
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  addChat: (chat) => set((state) => ({
    chats: [...state.chats, chat]
  })),
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    )
  })),
  archiveChat: (chatId) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, archived: true } : chat
    )
  })),
  unarchiveChat: (chatId) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, archived: false } : chat
    )
  })),
  hideChat: (chatId, password) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, hidden: true, hiddenPassword: password } : chat
    )
  })),
  unhideChat: (chatId) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, hidden: false, hiddenPassword: undefined } : chat
    )
  })),
  
  addMessage: (chatId, message) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, message],
            lastMessage: message,
            unreadCount: chat.id === state.activeChatId ? 0 : chat.unreadCount + 1
          }
        : chat
    )
  })),
  updateMessageStatus: (chatId, messageId, status) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId
        ? {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId ? { ...msg, status } : msg
            )
          }
        : chat
    )
  })),
  setTypingUsers: (chatId, userIds) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, typingUsers: userIds } : chat
    )
  })),
  
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  },
  
  friends: [],
  friendRequests: [],
  addFriend: (user) => set((state) => ({
    friends: [...state.friends, user]
  })),
  removeFriend: (userId) => set((state) => ({
    friends: state.friends.filter(f => f.id !== userId)
  })),
  sendFriendRequest: (fromUser, toUser) => set((state) => ({
    friendRequests: [...state.friendRequests, {
      id: `req_${Date.now()}`,
      fromUser,
      toUser,
      status: 'pending',
      createdAt: new Date()
    }]
  })),
  acceptFriendRequest: (requestId) => set((state) => {
    const request = state.friendRequests.find(r => r.id === requestId)
    if (!request) return state
    
    return {
      friendRequests: state.friendRequests.map(r =>
        r.id === requestId ? { ...r, status: 'accepted' as const } : r
      ),
      friends: [...state.friends, request.fromUser]
    }
  }),
  rejectFriendRequest: (requestId) => set((state) => ({
    friendRequests: state.friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    )
  })),
  
  call: null,
  initiateCall: (type, recipient) => set({
    call: {
      active: true,
      type,
      initiator: {} as User,
      recipient,
      startTime: new Date()
    }
  }),
  endCall: () => set({ call: null }),
  
  notificationsEnabled: true,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  
  customStickers: [],
  addCustomSticker: (sticker) => set((state) => ({
    customStickers: [...state.customStickers, sticker]
  })),
  removeCustomSticker: (stickerId) => set((state) => ({
    customStickers: state.customStickers.filter(s => s.id !== stickerId)
  })),
  
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: `notif_${Date.now()}`,
      ...notification
    }]
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  totalUnread: 0,
  updateUnreadCount: () => set((state) => ({
    totalUnread: state.chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
  }))
}))
