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
  verification?: UserVerification
  status?: UserStatus
  role?: 'admin' | 'user'
  suspended?: boolean
  banned?: boolean
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'sticker' | 'poll'
  timestamp: Date
  status: MessageStatus
  visibility: MessageVisibility
  imageUrl?: string
  voiceDuration?: number
  stickerUrl?: string
  reactions?: MessageReaction[]
  isEncrypted: boolean
  starred?: boolean
  pollId?: string
  effectType?: 'confetti' | 'sparkle' | 'pulse' | 'none'
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
  readReceiptsSetting?: 'everyone' | 'friends_only' | 'no_one'
  polls?: Poll[]
  pinnedMessages?: string[]
  adminIds?: string[]
  restrictedUsers?: string[]
  slowModeEnabled?: boolean
  mediaRestricted?: boolean
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

export type VerificationMethod = 'phone' | 'email' | 'none'

export interface UserVerification {
  phoneVerified: boolean
  emailVerified: boolean
  verifiedAt: Date | null
  primaryMethod: VerificationMethod
}

export interface UserStatus {
  message: string
  emoji: string
  expiresAt: Date | null
  createdAt: Date
}

export interface Device {
  id: string
  name: string
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android'
  browser?: string
  lastActive: Date
  isCurrent: boolean
}

export interface AnalyticsData {
  totalUsers: number
  activeUsersToday: number
  totalMessagesSent: number
  activeGroups: number
  reportsSubmitted: number
  suspendedUsers: number
  bannedUsers: number
}

export interface Poll {
  id: string
  chatId: string
  question: string
  options: { id: string; text: string; votes: number }[]
  anonymous: boolean
  multipleVotes: boolean
  expiresAt: Date | null
  voters: Record<string, string[]>
}

export interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

export interface Notification {
  id: string
  username: string
  message: string
  type: 'message' | 'image' | 'voice'
  timestamp: Date
}
