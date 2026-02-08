export type MessageStatus = 'sent' | 'delivered' | 'seen'
export type MessageVisibility = 'forever' | 'view_once' | 'view_twice'
export type ChatType = 'dm' | 'group'

export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  pronouns?: string
  about?: string
  online: boolean
  lastSeen?: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'sticker'
  timestamp: Date
  status: MessageStatus
  visibility: MessageVisibility
  imageUrl?: string
  voiceDuration?: number
  stickerUrl?: string
  reactions?: Record<string, number>
  isEncrypted: boolean
}

export interface Chat {
  id: string
  type: ChatType
  name: string
  avatar: string
  lastMessage?: Message
  unreadCount: number
  participants: User[]
  archived: boolean
  hidden: boolean
  hiddenPassword?: string
  messages: Message[]
  typingUsers: string[]
  createdAt: Date
}

export interface FriendRequest {
  id: string
  fromUser: User
  toUser: User
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export interface CallState {
  active: boolean
  type: 'voice' | 'video'
  initiator: User
  recipient: User
  startTime?: Date
  duration?: number
}

export interface Sticker {
  id: string
  url: string
  category: string
  custom: boolean
  userId?: string
}
