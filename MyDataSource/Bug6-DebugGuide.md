# Bug #6 Debugging Guide - Notifications Not Working

**Date:** March 9, 2026  
**Branch:** feature/bug-fixes-phase-1  
**Status:** 🔍 Debugging Added - Ready to Test

---

## ✅ What I Just Added

### Debug Logging at Every Critical Point:

1. **useNotifications Hook** (`hooks/notifications/use-notifications.ts`)
   - Logs session state
   - Logs when loading starts
   - Logs results (count, errors)

2. **getAllNotifications Service** (`lib/services/notifications/get-all-notifications.ts`)
   - Logs authentication checks
   - Logs API call start
   - Logs success/failure with details

3. **fetchAllNotifications API** (`lib/external/lens/primitives/notifications.ts`)
   - Logs Lens Protocol API calls
   - Logs results from both notification types
   - Logs any API errors

4. **NotificationsPage** (`app/notifications/page.tsx`)
   - Visual debug panel (yellow box, dev mode only)
   - Shows all auth states
   - Shows notification state
   - Console logs on every render

---

## 🧪 How to Test

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Open Browser Console
- Chrome/Edge: `F12` or `Cmd+Option+I` (Mac)
- Firefox: `F12` or `Cmd+Option+K` (Mac)
- Go to "Console" tab

### Step 3: Navigate to Notifications
```
http://localhost:3000/notifications
```

### Step 4: Look for Debug Info

**In the page (yellow box):**
```
🐛 Debug Info
Auth Store - isLoggedIn: ✅ or ❌
Auth Store - account: ✅ username or ❌
Session Client - data: ✅ or ❌
Session Client - loading: ⏳ or ✅
Notifications - loading: ⏳ or ✅
Notifications - error: None or [error message]
Notifications - count: [number]
```

**In browser console:**
Look for logs with emojis:
```
🔍 [useNotifications] Starting load...
📡 [getAllNotifications] Called
🚀 [getAllNotifications] Fetching from Lens API...
🌐 [fetchAllNotifications] Fetching from Lens Protocol...
📥 [fetchAllNotifications] API Results:
✅ [fetchAllNotifications] Returning X total notifications
```

---

## 🎯 What to Look For

### Scenario 1: Not Logged In
**Expected logs:**
```
🔍 [useNotifications] Starting load...
  sessionClient.data exists: false
📡 [getAllNotifications] Called
  sessionClient.data exists: false
❌ [getAllNotifications] Not authenticated
```

**Debug panel shows:**
```
Auth Store - isLoggedIn: ❌
Session Client - data: ❌
Notifications - error: You must be logged in to view notifications.
```

**Fix:** User needs to log in first

---

### Scenario 2: Logged In, No Notifications
**Expected logs:**
```
🔍 [useNotifications] Starting load...
  sessionClient.data exists: true
📡 [getAllNotifications] Called
  sessionClient.data exists: true
🚀 [getAllNotifications] Fetching from Lens API...
🌐 [fetchAllNotifications] Fetching from Lens Protocol...
📥 [fetchAllNotifications] API Results:
  Main notifications: 0
  Rewards notifications: 0
✅ [fetchAllNotifications] Returning 0 total notifications
```

**Debug panel shows:**
```
Auth Store - isLoggedIn: ✅
Session Client - data: ✅
Notifications - count: 0
```

**This is normal:** User has no notifications yet

---

### Scenario 3: Lens API Error
**Expected logs:**
```
🔍 [useNotifications] Starting load...
📡 [getAllNotifications] Called
🚀 [getAllNotifications] Fetching from Lens API...
🌐 [fetchAllNotifications] Fetching from Lens Protocol...
📥 [fetchAllNotifications] API Results:
  Main notifications: ERROR
  ❌ Main notifications error: [error details]
```

**Debug panel shows:**
```
Session Client - data: ✅
Notifications - error: [error message]
```

**Possible causes:**
- Lens API permissions issue
- Network error
- Invalid APP_ADDRESS
- API rate limiting

---

### Scenario 4: Session Loading Forever
**Expected logs:**
```
🔍 [useNotifications] Starting load...
  sessionClient.loading: true
  ⏳ Session still loading, skipping...
```

**Debug panel shows:**
```
Session Client - loading: ⏳
Notifications - loading: ⏳
```

**Possible causes:**
- Lens SDK not initialized
- Wallet not connected
- Authentication stuck

---

## 📋 Testing Checklist

Test these scenarios and report what you see:

### Test 1: Not Logged In
- [ ] Go to /notifications without logging in
- [ ] Check debug panel
- [ ] Check console logs
- [ ] Screenshot or copy error message

### Test 2: Logged In
- [ ] Connect wallet
- [ ] Log in to Lens
- [ ] Go to /notifications
- [ ] Check debug panel
- [ ] Check console logs
- [ ] Note notification count

### Test 3: After Creating Activity
- [ ] Like a post
- [ ] Comment on something
- [ ] Wait 30 seconds
- [ ] Refresh /notifications
- [ ] Check if notification appears

### Test 4: Network Tab
- [ ] Open browser DevTools → Network tab
- [ ] Go to /notifications
- [ ] Look for API calls to Lens
- [ ] Check if any fail (red)
- [ ] Check response data

---

## 🐛 Common Issues & What They Mean

### Issue: "sessionClient.data exists: false"
**Meaning:** User not logged in to Lens  
**Fix:** Need to implement login check or better error message

### Issue: "Main notifications: ERROR"
**Meaning:** Lens API call failed  
**Fix:** Check error details, might be permissions or API issue

### Issue: "Notifications - count: 0" (but should have some)
**Meaning:** Either no notifications exist OR API filter is wrong  
**Fix:** Check if APP_ADDRESS is correct, or test with different account

### Issue: Debug panel doesn't show
**Meaning:** Not in development mode  
**Fix:** Make sure `NODE_ENV=development` or `npm run dev`

---

## 📊 Report Template

After testing, report back with this info:

```
**Test Results:**

1. Are you logged in? YES / NO
2. Debug panel shows:
   - isLoggedIn: 
   - account: 
   - sessionClient.data: 
   - error: 

3. Console logs show:
   [Copy relevant logs here]

4. Network tab shows:
   - Any failed requests? YES / NO
   - If yes, which URL and what error?

5. Expected behavior:
   [What should happen]

6. Actual behavior:
   [What actually happens]
```

---

## 🔧 Next Steps After Testing

Based on what we find, the fix will be one of:

### If authentication issue:
- Add login check to notifications page
- Show "Please log in" message
- Redirect to login or show login button

### If API error:
- Fix APP_ADDRESS configuration
- Add better error handling
- Handle API rate limits

### If no notifications (legitimate):
- Show empty state message
- Add helpful text like "No notifications yet"
- Maybe add tips on how to get notifications

### If API permissions:
- Check Lens app configuration
- Verify notification permissions
- Update API filter if needed

---

## 🎯 Ready to Test!

1. **Start dev server:** `npm run dev`
2. **Open browser console**
3. **Go to:** http://localhost:3000/notifications
4. **Look at:**
   - Yellow debug panel on page
   - Console logs with emojis
   - Network tab for API calls
5. **Report back** with what you see!

---

**The debug logs will tell us exactly where it's failing and why. Then we can implement the minimal fix!** 🚀
