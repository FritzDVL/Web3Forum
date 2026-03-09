# Bugs #9, #5, #2 - Testing Guide

**Date:** March 9, 2026  
**Branch:** feature/bug-fixes-phase-1  
**Status:** 🔍 Debugging Added - Ready to Test

---

## ✅ What's Been Added

### Debug Logging + Validation for 3 Bugs:

1. **Bug #9: Join Communities**
   - Logging in button component
   - Logging in useJoinCommunity hook
   - Tracks auth state and API calls

2. **Bug #5: Switch Account**
   - Logging in useSwitchAccount hook
   - Logging in navbar handler
   - Tracks each step of account switch

3. **Bug #2: Unclear Error Messages**
   - Form validation for post creation
   - Clear error messages for each issue
   - Better authentication checks

---

## 🧪 How to Test All 3 Bugs

### Setup:
```bash
npm run dev
```

Open browser console (`F12` or `Cmd+Option+I`)

---

## Bug #9: Join Communities

### Test 1: Try to Join a Community (Not Logged In)

**Steps:**
1. Go to any community page (e.g., `/communities/[address]`)
2. Click "Join" button
3. Check console logs

**Expected Logs:**
```
🔍 [JoinCommunityButton] Render: { communityName, isLoggedIn: false }
🚀 [JoinCommunityButton] Join clicked
🔍 [useJoinCommunity] Called for: [community name]
  sessionClient.data exists: false
❌ [useJoinCommunity] Not logged in
```

**Expected UI:**
- Toast: "Not logged in - Please log in to join communities."

---

### Test 2: Try to Join a Community (Logged In)

**Steps:**
1. Log in to Lens
2. Go to any community page
3. Click "Join" button
4. Check console logs

**Expected Logs:**
```
🔍 [JoinCommunityButton] Render: { isLoggedIn: true }
🚀 [JoinCommunityButton] Join clicked
🔍 [useJoinCommunity] Called for: [community name]
  sessionClient.data exists: true
  walletClient.data exists: true
🚀 [useJoinCommunity] Calling joinCommunity service...
📊 [useJoinCommunity] Service result: { success: true/false }
```

**If Success:**
```
✅ [useJoinCommunity] Join successful
✅ [JoinCommunityButton] Join successful, calling onStatusChange
```

**If Failure:**
```
❌ [useJoinCommunity] Join failed: [error message]
```

**Expected UI:**
- Loading toast: "Joining community..."
- Success toast: "You have joined the community!"
- OR Error toast: "Action Failed - Unable to update your membership status."

---

### Test 3: Wallet Not Connected

**Steps:**
1. Log in to Lens but disconnect wallet
2. Try to join community
3. Check console logs

**Expected:**
```
❌ [useJoinCommunity] Wallet not connected
```

**Expected UI:**
- Toast: "Wallet not connected - Please connect your wallet to join communities."

---

## Bug #5: Switch Account

### Test 1: Switch Account (Success)

**Steps:**
1. Log in with multiple Lens accounts
2. Click profile avatar → "Switch account"
3. Select different account
4. Check console logs

**Expected Logs:**
```
🔍 [Navbar] Switch account clicked: @username
🔍 [useSwitchAccount] Switching to: 0x123...
  Current account: @username
🚀 [useSwitchAccount] Calling Lens switchAccount...
📊 [useSwitchAccount] Switch result: { hasResult: true, isErr: false }
✅ [useSwitchAccount] Setting lens session...
🚀 [useSwitchAccount] Fetching account details...
📊 [useSwitchAccount] Account fetch result: { isErr: false }
✅ [useSwitchAccount] Setting account in store...
✅ [useSwitchAccount] Switch complete!
✅ [Navbar] Switch successful, closing dialog
```

**Expected UI:**
- Dialog closes
- Profile avatar updates to new account
- Page reflects new account

---

### Test 2: Switch Account (Failure)

**Steps:**
1. Try to switch account
2. If it fails, check console logs

**Expected Logs:**
```
❌ [useSwitchAccount] Switch failed: [error message]
OR
❌ [useSwitchAccount] Account fetch failed: [error message]
OR
❌ [useSwitchAccount] Exception: [error]
❌ [Navbar] Switch account error: [error]
```

**Expected UI:**
- Error should be visible (currently just console, might need toast)

---

## Bug #2: Unclear Error Messages

### Test 1: Create Post with Empty Title

**Steps:**
1. Go to `/commons/[address]/new-post`
2. Leave title empty
3. Fill in content
4. Click "Create Post"
5. Check console logs

**Expected Logs:**
```
🔍 [CreatePostForm] Submit clicked
  Form data: { title: "", summary: "", contentLength: X }
❌ [CreatePostForm] Title is empty
```

**Expected UI:**
- Toast: "Title Required - Please enter a title for your post."
- Form stays on page (doesn't submit)

---

### Test 2: Create Post with Empty Content

**Steps:**
1. Fill in title
2. Leave content empty
3. Click "Create Post"

**Expected Logs:**
```
❌ [CreatePostForm] Content is empty
```

**Expected UI:**
- Toast: "Content Required - Please write some content for your post."

---

### Test 3: Create Post with Short Content

**Steps:**
1. Fill in title
2. Write only 5 characters in content
3. Click "Create Post"

**Expected Logs:**
```
❌ [CreatePostForm] Content too short
```

**Expected UI:**
- Toast: "Content Too Short - Please write at least 10 characters."

---

### Test 4: Create Post Not Logged In

**Steps:**
1. Log out
2. Try to create post

**Expected Logs:**
```
❌ [CreatePostForm] Not authenticated
```

**Expected UI:**
- Toast: "Authentication Required - Please sign in to create a post."

---

### Test 5: Create Post Without Wallet

**Steps:**
1. Log in but disconnect wallet
2. Try to create post

**Expected Logs:**
```
❌ [CreatePostForm] Wallet not connected
```

**Expected UI:**
- Toast: "Wallet Connection Required - Please connect your wallet to create a post."

---

### Test 6: Create Post Successfully

**Steps:**
1. Log in
2. Connect wallet
3. Fill in all fields correctly
4. Click "Create Post"

**Expected Logs:**
```
🔍 [CreatePostForm] Submit clicked
  Form data: { title: "...", contentLength: 100 }
🚀 [CreatePostForm] Starting post creation...
📊 [CreatePostForm] Article data prepared
📊 [CreatePostForm] Article result: { success: true, hasPost: true }
```

**Expected UI:**
- Loading toast: "Creating post..."
- Success toast: "Post created successfully!"
- Redirect to post page

---

## 📊 Report Template

After testing, report back with:

```
**Bug #9 - Join Communities:**
- Logged in: YES / NO
- Wallet connected: YES / NO
- Button clicked: YES / NO
- Console logs: [paste relevant logs]
- What happened: [describe]
- Expected: [what should happen]

**Bug #5 - Switch Account:**
- Multiple accounts: YES / NO
- Switch clicked: YES / NO
- Console logs: [paste relevant logs]
- What happened: [describe]
- Expected: [what should happen]

**Bug #2 - Error Messages:**
- Test scenario: [which test above]
- Console logs: [paste relevant logs]
- Toast message shown: [what it said]
- Was it clear? YES / NO
- What happened: [describe]
```

---

## 🎯 What We're Looking For

### Bug #9 (Join Communities):
- Does the button work when logged in?
- Are error messages clear?
- Does it fail at auth check or API call?

### Bug #5 (Switch Account):
- Does account switch complete?
- Where does it fail (if it fails)?
- Does UI update after switch?

### Bug #2 (Error Messages):
- Are validation messages clear?
- Do they appear before submission?
- Are they helpful?

---

## 🔧 Common Issues to Check

### All Bugs:
- [ ] User logged in to Lens?
- [ ] Wallet connected?
- [ ] Network requests in Network tab?
- [ ] Any red errors in console?

### Bug #9 Specific:
- [ ] Community page loads?
- [ ] Join button visible?
- [ ] Button enabled/disabled correctly?

### Bug #5 Specific:
- [ ] Multiple accounts available?
- [ ] Dialog opens?
- [ ] Account list shows?

### Bug #2 Specific:
- [ ] Form fields visible?
- [ ] Can type in fields?
- [ ] Submit button works?

---

## 🚀 Quick Test Script

Run through this quickly:

```
1. Bug #9:
   - Go to any community
   - Click Join (not logged in) → Should show error
   - Log in
   - Click Join again → Should work or show clear error

2. Bug #5:
   - Click profile avatar
   - Click "Switch account"
   - Select different account → Should switch or show clear error

3. Bug #2:
   - Go to create post
   - Try to submit empty → Should show "Title Required"
   - Fill title only → Should show "Content Required"
   - Fill both → Should create or show clear error
```

---

## 📝 Next Steps After Testing

Based on results, we'll:

1. **If bugs are fixed:** Remove debug logs, merge to main
2. **If bugs still exist:** Implement fixes based on what logs show
3. **If new issues found:** Add to bug list

---

**Ready to test! Start with Bug #9 (easiest to test), then #2, then #5.** 🚀
