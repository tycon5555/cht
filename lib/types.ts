export type MessageStatus = 'sent' | 'delivered' | 'seen'
export type MessageVisibility = 'forever' | 'view_once' | 'view_twice'
export type ChatType = 'dm' | 'group'
export type DisappearingMessageDuration = 'off' | '5s' | '30s' | '1m' | '1h' | '24h' | 'custom'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other'

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
  closed?: boolean
  disappearingMessageDuration?: DisappearingMessageDuration
  customDisappearingTime?: number
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

export interface BlockedUser {
  userId: string
  blockedAt: Date
}

export interface Report {
  id: string
  reportedUserId: string
  reason: ReportReason
  description?: string
  reportedAt: Date
  blockAfterReport?: boolean
}

export interface UserPrivacySettings {
  invisibleMode: boolean
  closedConversations: string[]
  blockedUsers: BlockedUser[]
  reports: Report[]
}
