# Reply Functionality Debug Checklist

## What to Check When Reply Doesn't Work

### 1. Check Browser Console
Open browser DevTools (F12) and look for:
- Red error messages
- The console.log messages I just added:
  - "Starting reply creation..."
  - "Creating metadata..."
  - "Uploading to storage..."
  - "Posting to Lens Protocol..."
  - Any error messages

### 2. Common Issues & Solutions

#### Issue: "Please sign in to reply"
**Cause**: Not authenticated with Lens Protocol
**Fix**: 
- Click "Connect Wallet" in navbar
- Select your Lens account
- Make sure you see your username in navbar

#### Issue: "Wallet not connected"
**Cause**: Wagmi wallet client not available
**Fix**:
- Disconnect and reconnect wallet
- Refresh page after connecting

#### Issue: "Failed to create reply" (generic)
**Cause**: Multiple possible causes
**Fix**: Check console for specific error

#### Issue: Feed address is placeholder (feed-20, feed-21, etc.)
**Cause**: Trying to reply to a post in a feed with fake address
**Fix**: 
- Only test replies on feeds with real Lens addresses
- Check which feeds have real addresses in Supabase

#### Issue: Post ID is invalid
**Cause**: Trying to reply to a post that doesn't exist on Lens
**Fix**: 
- Make sure you're replying to a real post
- Post ID should look like: "0x01-0x02-DA-..."

### 3. Quick Test Steps

1. **Verify you're logged in**:
   - Look at navbar - do you see your username?
   - If not, click "Connect Wallet"

2. **Try replying to a post**:
   - Go to a feed with a REAL Lens address (not feed-20, feed-21, etc.)
   - Click on a post
   - Write a reply
   - Click "Post Reply"

3. **Watch the console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for the log messages
   - Note where it fails

### 4. What to Tell Me

If it still doesn't work, tell me:
1. What error message you see (in UI or console)
2. Which feed you're trying to reply in
3. What the console logs show
4. Are you logged in? (username visible in navbar?)

### 5. Environment Variables Check

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_LENS_ENVIRONMENT=production
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GROVE_API_KEY=your_grove_key
```

### 6. Quick Fix: Restart Everything

Sometimes the simplest fix:
```bash
# Kill dev server
pkill -f "next dev"

# Clear cache
rm -rf .next

# Restart
npm run dev
```

Then hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
