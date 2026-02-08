'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { mockUsers, mockChats } from '@/lib/mock-data'
import { Sidebar } from '@/components/sidebar'
import { ChatWindow } from '@/components/chat-window'
import { FriendsList } from '@/components/friends-list'
import { ProfileModal } from '@/components/profile-modal'
import { AddFriendModal } from '@/components/add-friend-modal'
import { SettingsModal } from '@/components/settings-modal'
import { IncomingCallModal } from '@/components/incoming-call-modal'
import { ActiveCallScreen } from '@/components/active-call-screen'
import { NotificationToast } from '@/components/notification-toast'
import { HiddenChatModal } from '@/components/hidden-chat-modal'
import { CloseChatModal } from '@/components/close-chat-modal'
import { DeleteHistoryModal } from '@/components/delete-history-modal'
import { DisappearingMessagesModal } from '@/components/disappearing-messages-modal'
import { BlockUserModal } from '@/components/block-user-modal'
import { ReportUserModal } from '@/components/report-user-modal'
import { InvisibleModeModal } from '@/components/invisible-mode-modal'
import { motion } from 'framer-motion'
import type { Message, User } from '@/lib/types'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHiddenChats, setShowHiddenChats] = useState(false)
  const [showCloseChat, setShowCloseChat] = useState(false)
  const [showDeleteHistory, setShowDeleteHistory] = useState(false)
  const [showDisappearing, setShowDisappearing] = useState(false)
  const [showBlockUser, setShowBlockUser] = useState(false)
  const [showReportUser, setShowReportUser] = useState(false)
  const [showInvisibleMode, setShowInvisibleMode] = useState(false)
  const [incomingCall, setIncomingCall] = useState<{ caller: User; type: 'voice' | 'video' } | null>(null)
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([])

  const store = useAppStore()

  useEffect(() => {
    setMounted(true)
    // Initialize with mock data
    if (!store.currentUser) {
      store.setCurrentUser(mockUsers.current_user)
    }
    
    // Add mock chats to store
    mockChats.forEach((chat) => {
      if (!store.chats.find((c) => c.id === chat.id)) {
        store.addChat(chat)
      }
    })

    // Set first chat as active
    if (!store.activeChatId && mockChats.length > 0) {
      store.setActiveChatId(mockChats[0].id)
    }

    // Add initial friends (from other users)
    const allUsers = Object.values(mockUsers).filter(u => u.id !== mockUsers.current_user.id)
    allUsers.forEach(user => {
      if (!store.friends.find(f => f.id === user.id)) {
        store.addFriend(user)
      }
    })

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      store.setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  if (!mounted || !store.currentUser) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg mx-auto mb-4 animate-pulse" />
          <p className="text-foreground">Loading Messenger...</p>
        </div>
      </div>
    )
  }

  const activeChat = store.chats.find((c) => c.id === store.activeChatId)

  const handleSendMessage = (content: string) => {
    if (!activeChat) return

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: activeChat.id,
      senderId: store.currentUser!.id,
      content,
      type: 'text',
      timestamp: new Date(),
      status: 'sent',
      visibility: 'forever',
      isEncrypted: true,
      reactions: {},
    }

    store.addMessage(activeChat.id, newMessage)

    // Show notification
    const otherUser = activeChat.participants.find(p => p.id !== store.currentUser!.id)
    if (otherUser && store.notificationsEnabled) {
      const notifId = `notif_${Date.now()}`
      store.addNotification({
        username: otherUser.displayName,
        message: content.substring(0, 50),
        type: 'message',
      })
      setVisibleNotifications([...visibleNotifications, notifId])
      setTimeout(() => {
        setVisibleNotifications(prev => prev.filter(id => id !== notifId))
      }, 4000)
    }

    // Simulate delivery and read statuses
    setTimeout(() => {
      store.updateMessageStatus(activeChat.id, newMessage.id, 'delivered')
    }, 1000)

    setTimeout(() => {
      store.updateMessageStatus(activeChat.id, newMessage.id, 'seen')
    }, 2000)
  }

  const handleCall = (type: 'voice' | 'video') => {
    const otherUser = activeChat?.participants.find(p => p.id !== store.currentUser!.id)
    if (otherUser) {
      setIncomingCall({ caller: otherUser, type })
      setTimeout(() => {
        setIncomingCall(null)
      }, 8000)
    }
  }

  const handleAcceptCall = () => {
    if (incomingCall) {
      // Would show active call screen
      setIncomingCall(null)
    }
  }

  const handleAddFriend = (user: User) => {
    if (!store.friends.find(f => f.id === user.id)) {
      store.addFriend(user)
      setShowAddFriend(false)
    }
  }

  const handleUnlockHidden = (password: string) => {
    if (password === 'secret123') {
      console.log('[v0] Hidden chats unlocked')
      setShowHiddenChats(false)
    } else {
      console.log('[v0] Wrong password')
    }
  }

  const handleCloseChat = () => {
    if (activeChat) {
      store.closeChat(activeChat.id)
      store.setActiveChatId(store.chats.find(c => c.id !== activeChat.id)?.id || null)
      setShowCloseChat(false)
    }
  }

  const handleDeleteHistory = (type: 'all' | 'older_than', duration?: string) => {
    if (activeChat) {
      store.deleteMessageHistory(activeChat.id, type)
      setShowDeleteHistory(false)
    }
  }

  const handleSetDisappearing = (duration: string) => {
    if (activeChat) {
      store.setDisappearingMessages(activeChat.id, duration)
      setShowDisappearing(false)
    }
  }

  const handleBlockUser = () => {
    if (activeChat) {
      const otherUser = activeChat.participants.find(p => p.id !== store.currentUser!.id)
      if (otherUser) {
        store.blockUser(otherUser.id)
        store.removeFriend(otherUser.id)
        setShowBlockUser(false)
      }
    }
  }

  const handleReportUser = (reason: string, description: string, blockAfterReport: boolean) => {
    if (activeChat) {
      const otherUser = activeChat.participants.find(p => p.id !== store.currentUser!.id)
      if (otherUser) {
        store.reportUser(otherUser.id, reason, description, blockAfterReport)
        setShowReportUser(false)
      }
    }
  }

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 hidden md:flex flex-col">
        <Sidebar
          currentUser={store.currentUser}
          chats={store.chats}
          activeChatId={store.activeChatId}
          onChatSelect={store.setActiveChatId}
          onUnlockHidden={() => setShowHiddenChats(true)}
        />
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          currentUser={store.currentUser}
          onSendMessage={handleSendMessage}
          onCall={handleCall}
          onClose={() => setShowCloseChat(true)}
          onDelete={() => setShowDeleteHistory(true)}
          onDisappearing={() => setShowDisappearing(true)}
          onBlock={() => setShowBlockUser(true)}
          onReport={() => setShowReportUser(true)}
          onArchive={() => store.archiveChat(activeChat.id)}
          isBlocked={
            store.currentUser && activeChat?.participants
              ? store.isUserBlocked(
                  activeChat.participants.find(
                    p => p.id !== store.currentUser?.id
                  )?.id || ''
                )
              : false
          }
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Chat Selected</h2>
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          </div>
        </div>
      )}

      {/* Friends Sidebar - Hidden on mobile */}
      <div className="w-80 hidden lg:flex flex-col">
        <FriendsList
          friends={store.friends}
          onAddFriend={() => setShowAddFriend(true)}
          onMessage={(userId) => {
            const chat = store.chats.find(c => c.participants.some(p => p.id === userId))
            if (chat) {
              store.setActiveChatId(chat.id)
            }
          }}
        />
      </div>

      {/* Modals */}
      <ProfileModal
        user={store.currentUser}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        isEditable={true}
        onSave={(updates) => {
          store.setCurrentUser({ ...store.currentUser!, ...updates })
        }}
      />

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onAddFriend={handleAddFriend}
        allUsers={Object.values(mockUsers).filter(u => u.id !== store.currentUser!.id)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={store.theme}
        onThemeChange={(theme) => {
          store.setTheme(theme)
          document.documentElement.setAttribute('data-theme', theme)
          localStorage.setItem('theme', theme)
        }}
        notificationsEnabled={store.notificationsEnabled}
        onNotificationsChange={store.setNotificationsEnabled}
        invisibleMode={store.privacySettings.invisibleMode}
        onInvisibleModeChange={store.setInvisibleMode}
        blockedUsers={store.privacySettings.blockedUsers}
        onUnblockUser={store.unblockUser}
        closedChats={store.privacySettings.closedConversations}
        onReopenChat={store.reopenChat}
      />

      <CloseChatModal
        isOpen={showCloseChat}
        onClose={() => setShowCloseChat(false)}
        onConfirm={handleCloseChat}
        chatName={activeChat?.name || 'User'}
      />

      <DeleteHistoryModal
        isOpen={showDeleteHistory}
        onClose={() => setShowDeleteHistory(false)}
        onConfirm={handleDeleteHistory}
        chatName={activeChat?.name || 'User'}
      />

      <DisappearingMessagesModal
        isOpen={showDisappearing}
        onClose={() => setShowDisappearing(false)}
        onConfirm={handleSetDisappearing}
        currentDuration={activeChat?.disappearingMessageDuration || 'off'}
        chatName={activeChat?.name || 'User'}
      />

      <BlockUserModal
        isOpen={showBlockUser}
        onClose={() => setShowBlockUser(false)}
        onConfirm={handleBlockUser}
        user={activeChat?.participants.find(p => p.id !== store.currentUser!.id) || null}
      />

      <ReportUserModal
        isOpen={showReportUser}
        onClose={() => setShowReportUser(false)}
        onConfirm={handleReportUser}
        user={activeChat?.participants.find(p => p.id !== store.currentUser!.id) || null}
      />

      <InvisibleModeModal
        isOpen={showInvisibleMode}
        onClose={() => setShowInvisibleMode(false)}
        onToggle={store.setInvisibleMode}
        isEnabled={store.privacySettings.invisibleMode}
      />

      <IncomingCallModal
        isOpen={!!incomingCall}
        caller={incomingCall?.caller || null}
        type={incomingCall?.type || 'voice'}
        onAccept={handleAcceptCall}
        onReject={() => setIncomingCall(null)}
      />

      <HiddenChatModal
        isOpen={showHiddenChats}
        onClose={() => setShowHiddenChats(false)}
        onUnlock={handleUnlockHidden}
      />

      {/* Notifications */}
      <motion.div className="fixed top-4 right-4 z-40 space-y-2 pointer-events-none">
        {store.notifications.slice(-3).map((notif) => (
          visibleNotifications.includes(notif.id) && (
            <motion.div key={notif.id} className="pointer-events-auto">
              <NotificationToast
                id={notif.id}
                username={notif.username}
                message={notif.message}
                type={notif.type as 'message' | 'image' | 'voice'}
                onClose={() => {
                  setVisibleNotifications(prev => prev.filter(id => id !== notif.id))
                }}
              />
            </motion.div>
          )
        ))}
      </motion.div>
    </div>
  )
}
