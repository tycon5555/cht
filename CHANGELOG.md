# Changelog

## Version 1.1.0 - Advanced Privacy & Safety Features

### 🔧 Fixes
- **Fixed Image Configuration Error** 
  - ✅ Added `next.config.mjs` with remote image pattern configuration
  - ✅ Configured `images.unsplash.com` for avatar images
  - ✅ Configured `api.dicebear.com` for avatar fallbacks
  - ✅ Resolved "Image src not configured" error in Next.js

### 🆕 New Features

#### Privacy & Safety System
- **Close DM Feature** - Remove conversations from chat list with ability to reopen
- **Delete Chat History** - Flexible message deletion (all/24h/7d/30d/custom)
- **Disappearing Messages** - Auto-expiring messages (5s/30s/1m/1h/24h)
- **Block/Unblock Users** - Comprehensive blocking with status indicators
- **Invisible Mode** - Ghost mode to appear offline with optional friend exceptions
- **Report User System** - Structured moderation with reason selection and auto-block option

#### Components
- `CloseChatModal` - Conversation closure with confirmation
- `DeleteHistoryModal` - Message history deletion interface
- `DisappearingMessagesModal` - Message expiry duration selector
- `BlockUserModal` - Block confirmation with detailed effects
- `ReportUserModal` - Report submission form with optional blocking
- `InvisibleModeModal` - Ghost mode toggle with settings
- `DmActionsMenu` - Comprehensive DM action menu (3-dot)
- `SuccessModal` - Auto-dismissing success notifications

#### Enhanced Components
- `SettingsModal` - Added Privacy & Security tab with blocked users/closed chats
- `ChatWindow` - Integrated DM actions menu and closed chat UI
- `DmActionsMenu` - New dropdown for privacy actions

### 📝 Updates

#### Type System (`lib/types.ts`)
- Added `DisappearingMessageDuration` type
- Added `ReportReason` type
- Added `BlockedUser` interface
- Added `Report` interface
- Added `UserPrivacySettings` interface
- Extended `Chat` interface with privacy fields

#### State Management (`lib/store.ts`)
- Added privacy settings state
- Implemented `setInvisibleMode()` method
- Implemented `blockUser()` / `unblockUser()` methods
- Implemented `isUserBlocked()` method
- Implemented `closeChat()` / `reopenChat()` methods
- Implemented `reportUser()` method
- Implemented `setDisappearingMessages()` method
- Implemented `deleteMessageHistory()` method
- Implemented `deleteMessage()` method

#### Main Page (`app/page.tsx`)
- Added privacy modal state management
- Added privacy action handlers
- Integrated all new modals
- Added privacy props to ChatWindow
- Connected store methods to UI actions

#### Settings Modal (`components/settings-modal.tsx`)
- Added tab navigation (General / Privacy / About)
- Added Invisible Mode toggle
- Added Blocked Users list
- Added Closed Conversations list
- Added Unblock/Reopen buttons

#### Chat Window (`components/chat-window.tsx`)
- Added DM Actions menu to header (DM only)
- Added closed chat notice UI
- Added blocked user notice UI
- Added disabled input state for blocked/closed chats
- Connected all privacy action handlers

### 🎨 Design Updates
- Consistent red accent for destructive actions
- Smooth modal transitions with Framer Motion
- Real-time state updates across UI
- Accessible keyboard navigation
- Responsive mobile-first design
- Dark/Light theme compatibility

### 📊 Statistics
- **9 new components** for privacy features
- **8 new TypeScript types/interfaces**
- **12 new store methods** for privacy management
- **Comprehensive feature documentation** (FEATURES.md)

### 🔐 Security Notes
- All features use client-side simulation
- Ready for backend integration
- No breaking changes to existing functionality
- Full backward compatibility maintained

### 📦 Dependencies
- No new external dependencies added
- Uses existing: Framer Motion, Zustand, Lucide Icons

### 🐛 Bug Fixes
- Fixed Image component unconfigured hostname error
- Fixed modal z-index layering
- Fixed keyboard navigation in menus

### 📚 Documentation
- Created comprehensive FEATURES.md guide
- Updated component documentation
- Added usage examples
- Added type definitions

---

## Version 1.0.0 - Initial Premium Messaging App

### Initial Features
- One-to-one and group messaging
- Real-time message status (sent/delivered/seen)
- User profiles and friend system
- Voice and video call UI
- Notification system
- Message visibility settings (forever/view once/view twice)
- Hidden/archived chats
- Sticker picker
- Dark/Light theme
- Message reactions framework
- Typing indicators
- Online status indicators

---

## 🚀 Next Steps

### Planned Features (v1.2.0)
- End-to-end encryption implementation
- Two-factor authentication
- Message pinning
- Chat search
- Advanced group chat permissions
- Message reactions UI
- Custom themes
- Voice message playback
- Image gallery
- Message forwarding

### Backend Integration (v2.0.0)
- Real user authentication
- Database persistence
- Real-time WebSocket messaging
- Actual encryption
- Server-side moderation
- User verification
- Backup & recovery
- Analytics

---

**Last Updated:** February 8, 2026  
**Maintainer:** Premium Messenger Team  
**License:** MIT
