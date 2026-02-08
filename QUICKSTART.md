# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Start the App
```bash
npm run dev
```
Open http://localhost:3000

### 2. The App Loads With:
- Pre-loaded chat conversations
- Multiple users to test with
- All privacy features enabled
- Dark theme by default

---

## 🎮 Try Each Feature Right Now

### Feature 1: Close a Conversation
1. Click on any chat
2. Click **⋮** (3-dot menu) in header
3. Select **"Close Chat"**
4. Confirm
5. ✅ Chat hidden, messaging disabled

### Feature 2: Delete Messages
1. Open any chat
2. Click **⋮** → **"Delete Chat History"**
3. Choose option (all or time range)
4. Confirm deletion
5. ✅ Messages removed

### Feature 3: Disappearing Messages
1. Open any chat
2. Click **⋮** → **"Disappearing Messages"**
3. Select duration (e.g., "5 seconds")
4. Click "Save"
5. Send a message
6. ✅ Watch it disappear after 5 seconds

### Feature 4: Block a User
1. Open any chat
2. Click **⋮** → **"Block User"**
3. Review what happens
4. Click "Block User"
5. ✅ User blocked, chat disabled

### Feature 5: Invisible Mode
1. Click **⚙️** (Settings)
2. Click **"Privacy"** tab
3. Toggle **"Invisible Mode"**
4. Confirm
5. ✅ You're now "invisible" to others

### Feature 6: Report a User
1. Open any chat
2. Click **⋮** → **"Report User"**
3. Select reason (e.g., "Spam")
4. (Optional) Add details
5. Click **"Report"**
6. ✅ Report submitted

---

## 📱 Settings Panel

### Access: Click ⚙️ Icon

**Tabs:**
- **General** - Theme (Light/Dark), Notifications
- **Privacy** - Invisible Mode, Blocked Users, Closed Conversations
- **About** - App info

**Key Options:**
- 🌓 Dark/Light theme toggle
- 🔔 Enable/Disable notifications
- 👻 Enable Invisible Mode
- 🚫 View & manage blocked users
- 🔒 View & reopen closed conversations

---

## 👥 Test Accounts

Pre-loaded contacts:
- Sarah Chen
- James Wilson
- Emily Rodriguez
- Michael Zhang
- Lisa Anderson

Each has sample conversations ready to test.

---

## 🎨 Visual Indicators

### Chat Status
- 🟢 User online
- ⚫ User offline
- 🔒 Conversation closed
- 🚫 User blocked

### Message Status
- ✓ Sent
- ✓✓ Delivered
- ✓✓ Seen (blue)
- ⏱️ Disappearing message timer

---

## 💡 Pro Tips

1. **Test Multiple Features**
   - Close a chat, then reopen it from Settings
   - Block someone, then unblock
   - Set disappearing messages then send one

2. **Try Theme Switching**
   - Open Settings → General
   - Switch between Light/Dark themes
   - Privacy features work in both

3. **Check Mobile View**
   - Resize browser to mobile size
   - All features work on mobile
   - Touch-friendly controls

4. **Keyboard Navigation**
   - Tab through buttons
   - Enter to confirm modals
   - Esc to close modals

---

## 🐛 Troubleshooting

**Images not loading?**
- Already fixed in `next.config.mjs`
- Check browser console for errors
- Restart dev server

**Feature not working?**
- Check if chat is closed or user is blocked
- Try closing/reopening the modal
- Refresh page if needed

**Theme not changing?**
- Settings should apply immediately
- Dark mode is default
- Light theme available in Settings

---

## 📚 Learn More

- **Full Features:** See `FEATURES.md`
- **Implementation:** See `IMPLEMENTATION.md`
- **Changes Made:** See `CHANGELOG.md`
- **Summary:** See `SUMMARY.md`

---

## 🎯 Next Steps

### To Test
✅ Try each feature above (5 min)
✅ Test on mobile view (resize browser)
✅ Try theme switching
✅ Check Settings panel

### To Deploy
1. Run: `npm run build`
2. Test build: `npm start`
3. Deploy to Vercel

### To Customize
1. Check `IMPLEMENTATION.md` for customization guide
2. Modify `app/globals.css` for colors
3. Edit components in `components/` folder

---

## 🔑 Important Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main app |
| `lib/store.ts` | State & logic |
| `components/*.tsx` | UI components |
| `next.config.mjs` | Image config |
| `FEATURES.md` | Full guide |

---

## ✅ Feature Checklist

Track what you've tested:

- [ ] Close/Reopen chat
- [ ] Delete all messages
- [ ] Delete messages older than date
- [ ] Set disappearing messages
- [ ] Watch message disappear
- [ ] Block user
- [ ] Unblock user
- [ ] Enable Invisible Mode
- [ ] Report user
- [ ] Switch theme
- [ ] View settings tabs
- [ ] Test on mobile

---

## 💬 What Users See

### You (Current User)
- Sarah Chen (your profile)
- Friends list on the right
- Chat list on the left
- Settings gear icon

### When You Close a Chat
```
[Chat becomes inactive]
┌─────────────────────┐
│ 🔒 Conversation     │
│    closed           │
│ You cannot send     │
│ messages to this    │
│ chat               │
└─────────────────────┘
```

### When You Block Someone
```
[Chat shows notice]
┌─────────────────────┐
│ 🚫 You blocked      │
│    this user        │
│ Messaging and calls │
│ unavailable        │
└─────────────────────┘
```

---

## 🎬 Demo Flow (5 minutes)

1. **Start** (1 min)
   - App loads automatically
   - Browse pre-loaded chats

2. **Try Close** (1 min)
   - Open any chat
   - Click menu → Close → Confirm
   - See chat disable

3. **Try Report** (1 min)
   - Reopen Settings
   - Find closed chat
   - Click Reopen
   - Then Report User

4. **Try Settings** (2 min)
   - Click Settings gear
   - Switch theme
   - Enable Invisible Mode
   - Check Blocked Users

---

**Ready to explore? Start the app with `npm run dev` and try each feature!**

Questions? Check the docs:
- 📖 `FEATURES.md` - Detailed feature guide
- 🛠️ `IMPLEMENTATION.md` - Developer guide
- 📋 `SUMMARY.md` - What was built
