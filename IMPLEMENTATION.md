# Implementation Guide - Privacy & Safety Features

## Quick Start

### Installation
```bash
npm install
# or
yarn install
```

### Running the App
```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:3000`

---

## 🔧 Configuration

### Next.js Image Configuration
The app now includes proper Next.js image configuration for external sources:

**File:** `next.config.mjs`
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: 'api.dicebear.com' },
  ],
}
```

This allows Next.js Image component to load:
- Unsplash images for avatars
- DiceBear API avatars as fallback

---

## 🔐 Privacy Features - How to Use

### 1. Close a Conversation

**Steps:**
1. Open any DM conversation
2. Click the **3-dot menu** button in the chat header
3. Select **"Close Chat"**
4. Confirm in the modal that appears
5. Chat will be removed from main list
6. Message input will be disabled

**Access Closed Chats:**
1. Open **Settings** (gear icon)
2. Click **Privacy** tab
3. Scroll to "Closed Conversations"
4. Click **"Reopen"** button

---

### 2. Delete Chat History

**All Messages:**
1. Open DM → 3-dot menu → **"Delete Chat History"**
2. Select **"Delete all messages"**
3. Confirm with warning
4. All messages removed instantly

**Messages Older Than:**
1. Open DM → 3-dot menu → **"Delete Chat History"**
2. Select **"Delete messages older than"**
3. Choose duration:
   - Last 24 hours
   - Last 7 days
   - Last 30 days
   - Custom date
4. Confirm deletion

---

### 3. Disappearing Messages

**Enable:**
1. Open DM → 3-dot menu → **"Disappearing Messages"**
2. Select desired duration:
   - Off
   - 5 seconds
   - 30 seconds
   - 1 minute
   - 1 hour
   - 24 hours
3. Click **"Save"**

**Behavior:**
- Only affects NEW messages sent after enabling
- Shows timer icon ⏱️ on messages
- Countdown animation as time expires
- Message fades out and replaced with "This message disappeared"

---

### 4. Block/Unblock Users

**Block:**
1. Open DM with user
2. Click 3-dot menu → **"Block User"**
3. Review what blocking does
4. Click **"Block User"** to confirm
5. User removed from friends list
6. Chat shows "🚫 You have blocked this user"
7. Cannot send messages or call

**Unblock:**
1. Open **Settings** → **Privacy** tab
2. Find user in "Blocked Users" list
3. Click **"Unblock"** button
4. Confirm unblock
5. Full messaging restored

---

### 5. Invisible Mode (Ghost Mode)

**Enable:**
1. Open **Settings** → **Privacy** tab
2. Toggle **"Invisible Mode"** switch
3. Confirm in modal that appears

**When Active:**
- You appear offline to everyone
- Your last seen is hidden
- Typing indicators don't show
- "Seen" receipts show as "Delivered" only
- Messages still send normally
- Subtle "Invisible Mode Active" badge in profile

**Optional:**
- Check "Allow close friends to see my online status"
- Lets selected friends see you're online

---

### 6. Report User

**Report:**
1. Open DM → 3-dot menu → **"Report User"**
2. Modal shows user's profile
3. Select reason:
   - 🚫 Spam
   - 😠 Harassment
   - ⚠️ Inappropriate Content
   - 🎭 Impersonation
   - ❓ Other
4. (Optional) Add details in text area
5. (Optional) Check "Block user after reporting"
6. Click **"Report"**
7. Success confirmation shows
8. User optionally blocked if checkbox selected

---

## 🎮 User Interface Flow

### DM Menu (3-dot button)
```
┌─────────────────────┐
│ Archive Chat        │ → Archive chat
│ Disappearing Msgs   │ → Set auto-delete
│ Delete History      │ → Remove messages
│ Close Chat          │ → Disable messaging
│ Block User          │ → Prevent contact
│ Report User         │ → Submit complaint
└─────────────────────┘
```

### Settings → Privacy Tab
```
┌──────────────────────────┐
│ [General] [Privacy] [About]│
├──────────────────────────┤
│ Invisible Mode    [Toggle]│
│                          │
│ Blocked Users:           │
│  • User123        [Unblock]│
│  • Jane Doe       [Unblock]│
│                          │
│ Closed Conversations:    │
│  • Chat_12345     [Reopen] │
│  • Chat_67890     [Reopen] │
└──────────────────────────┘
```

---

## 🛠️ Developer Integration

### State Access
```typescript
import { useAppStore } from '@/lib/store'

const store = useAppStore()

// Check if user is blocked
const isBlocked = store.isUserBlocked(userId)

// Check privacy settings
const isInvisible = store.privacySettings.invisibleMode
const blockedUsers = store.privacySettings.blockedUsers
const closedChats = store.privacySettings.closedConversations
const reports = store.privacySettings.reports
```

### Triggering Actions
```typescript
// Close a conversation
store.closeChat(chatId)

// Reopen a closed chat
store.reopenChat(chatId)

// Block/Unblock
store.blockUser(userId)
store.unblockUser(userId)

// Report
store.reportUser(userId, 'spam', 'description', true)

// Disappearing messages
store.setDisappearingMessages(chatId, '5m')

// Delete messages
store.deleteMessage(chatId, messageId)
store.deleteMessageHistory(chatId, 'all')
store.deleteMessageHistory(chatId, 'older_than') // with date

// Invisible mode
store.setInvisibleMode(true)
```

### Using Components
```typescript
import { BlockUserModal } from '@/components/block-user-modal'
import { CloseChatModal } from '@/components/close-chat-modal'

// In your component
const [showBlock, setShowBlock] = useState(false)

return (
  <>
    <button onClick={() => setShowBlock(true)}>Block</button>
    <BlockUserModal
      isOpen={showBlock}
      onClose={() => setShowBlock(false)}
      onConfirm={() => store.blockUser(userId)}
      user={userObject}
    />
  </>
)
```

---

## 📋 Testing Checklist

### Close Chat Feature
- [ ] Can close any DM conversation
- [ ] Message input disabled when closed
- [ ] "Conversation Closed" notice appears
- [ ] Chat hidden from main list
- [ ] Can reopen from Settings
- [ ] Confirmation modal appears before closing

### Delete History
- [ ] Can delete all messages
- [ ] Can delete older than time period
- [ ] Messages removed from display
- [ ] Confirmation modal appears
- [ ] Different time options work

### Disappearing Messages
- [ ] Can enable disappearing messages
- [ ] Dropdown shows all durations
- [ ] Timer icon appears on messages
- [ ] Messages fade out after duration
- [ ] Only affects new messages
- [ ] Can toggle off

### Block/Unblock
- [ ] Can block users
- [ ] Cannot message blocked users
- [ ] Can view blocked users in Settings
- [ ] Can unblock users
- [ ] Messaging restored after unblock
- [ ] Confirmation modals work

### Invisible Mode
- [ ] Toggle shows modal with info
- [ ] Setting persists during session
- [ ] Typing indicators disabled
- [ ] Online status hidden
- [ ] Messages still send
- [ ] Can enable/disable anytime

### Report User
- [ ] Can open report modal
- [ ] All reasons selectable
- [ ] Text input accepts description
- [ ] Block checkbox available
- [ ] Success confirmation appears
- [ ] Reports stored in state

---

## 🎨 Customization

### Styling
All components use Tailwind CSS with semantic design tokens:
- `--primary` - Main action color (purple)
- `--secondary` - Accent color (cyan)
- `--destructive` - Warning/delete color (red)
- `--background` - Page background
- `--card` - Component background
- `--foreground` - Text color
- `--border` - Border color
- `--input` - Input field background

**Light/Dark Theme:**
- Automatic based on `data-theme` attribute
- Toggle in Settings → Appearance
- Persisted to localStorage

### Animations
All modals use Framer Motion with:
- Scale-in entrance animations
- Smooth fade transitions
- Button tap feedback
- Hover effects on interactive elements

To customize, modify animation props in component definitions.

---

## 🚀 Performance Tips

1. **Memoization**: Components already optimized with React hooks
2. **Lazy Loading**: Modals only render when opened
3. **State Management**: Zustand provides efficient updates
4. **Image Optimization**: Next.js Image component with remote patterns

---

## 🐛 Troubleshooting

### Image Error: "hostname not configured"
**Solution:** Already fixed in `next.config.mjs`. Ensure config has:
```javascript
remotePatterns: [
  { protocol: 'https', hostname: 'images.unsplash.com' },
]
```

### Modal not opening
**Check:**
- State is being set correctly: `setShowModal(true)`
- Modal import exists in component
- Parent component is rendering modal JSX

### Changes not reflecting in UI
**Check:**
- Using store method correctly: `store.actionName(...)`
- Component reads from store: `store.privacySettings`
- Using `.find()` or `.filter()` for UI updates

### Styling not applied
**Check:**
- Tailwind classes spelled correctly
- Design tokens exist in `globals.css`
- Theme attribute set on root: `data-theme="dark"`

---

## 📚 File Reference

### Core Files
- `app/page.tsx` - Main app with all state/handlers
- `lib/store.ts` - Zustand store with all methods
- `lib/types.ts` - TypeScript interfaces

### Privacy Components
- `components/close-chat-modal.tsx`
- `components/delete-history-modal.tsx`
- `components/disappearing-messages-modal.tsx`
- `components/block-user-modal.tsx`
- `components/report-user-modal.tsx`
- `components/invisible-mode-modal.tsx`
- `components/dm-actions-menu.tsx`
- `components/success-modal.tsx`

### Configuration
- `next.config.mjs` - Image remotePatterns
- `tailwind.config.ts` - Design system
- `app/globals.css` - Theme tokens

---

## 🔒 Production Checklist

Before deploying, ensure:
- [ ] All modals have proper error handling
- [ ] Confirmation before destructive actions
- [ ] Success feedback for all actions
- [ ] Disabled states for blocked users
- [ ] Mobile responsive tested
- [ ] Dark/light themes work
- [ ] Keyboard navigation functional
- [ ] Accessibility labels present
- [ ] No console errors
- [ ] Performance profiled

---

## 📞 Support

For issues or questions:
1. Check FEATURES.md for feature overview
2. Check CHANGELOG.md for version history
3. Review component source code (well commented)
4. Check types in lib/types.ts for data structures

---

**Last Updated:** February 8, 2026  
**Version:** 1.1.0
