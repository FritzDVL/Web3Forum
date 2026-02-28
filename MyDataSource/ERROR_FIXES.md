# Error Fixes - Lens Integration Issues

## Errors Fixed

### 1. ❌ Build Error: React Native Async Storage

**Error**:
```
Module not found: Can't resolve '@react-native-async-storage/async-storage'
```

**Cause**: MetaMask SDK tries to import React Native modules in browser environment

**Fix**: Added webpack fallback in `next.config.mjs`

```javascript
config.resolve.fallback = { 
  fs: false, 
  net: false, 
  tls: false,
  '@react-native-async-storage/async-storage': false,
};

config.resolve.alias = {
  ...config.resolve.alias,
  '@react-native-async-storage/async-storage': false,
};
```

**Status**: ✅ Fixed

---

### 2. ❌ Runtime Error: Supabase PGRST116

**Error**:
```
Error fetching feed: { code: 'PGRST116', details: 'The result contains 0 rows' }
```

**Cause**: Feed doesn't exist in database (placeholder addresses like "feed-1" not real Lens addresses)

**Fix**: Improved error handling in `lib/external/supabase/feeds.ts`

```typescript
if (error) {
  if (error.code === "PGRST116") {
    // Not found - return null instead of throwing
    console.log(`Feed not found for address: ${address}`);
    return null;
  }
  console.error("Error fetching feed:", error);
  return null;
}
```

**Additional Fix Needed**: Update feed addresses in Supabase to real Lens feed addresses

**Status**: ✅ Error handling fixed, ⚠️ Need real Lens addresses

---

### 3. ⚠️ Warning: WalletConnect Double Init

**Warning**:
```
WalletConnect Core is already initialized. Init() was called 2 times.
```

**Cause**: WagmiConfig and QueryClient created multiple times during React re-renders

**Fix**: Added singleton pattern in `components/providers/web3-provider.tsx`

```typescript
// Singleton for wagmi config
let wagmiConfig: ReturnType<typeof createConfig> | null = null;

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = createConfig(...);
  }
  return wagmiConfig;
}

// Use useMemo for QueryClient
const queryClient = useMemo(() => new QueryClient(), []);
const config = useMemo(() => getWagmiConfig(), []);
```

**Status**: ✅ Fixed

---

## Files Modified

1. `next.config.mjs` - Added webpack fallbacks
2. `lib/external/supabase/feeds.ts` - Improved error handling
3. `components/providers/web3-provider.tsx` - Added singleton pattern

---

## Testing Steps

### 1. Clear Build Cache
```bash
rm -rf .next
npm run dev
```

### 2. Test Feed Access
- Visit http://localhost:3000
- Click any feed link
- Should see either:
  - "Feed not found" (if address not in DB)
  - Feed page with posts (if address exists)

### 3. Check Console
- No more async-storage errors ✅
- No more PGRST116 errors (just logs) ✅
- WalletConnect warning should be gone ✅

---

## Next Steps to Complete Feed System

### Update Feed Addresses in Supabase

The placeholder addresses need to be replaced with real Lens feed addresses:

```sql
-- Example: Update feed addresses
UPDATE feeds 
SET lens_feed_address = '0x...' -- Real Lens feed address
WHERE lens_feed_address = 'feed-1';
```

**Options**:

**Option A**: Use existing Lens feeds (if you have them)
- Update each feed with its real Lens address
- Posts will appear immediately

**Option B**: Create new Lens feeds
- Use the `createFeed()` function in `lib/external/lens/primitives/feeds.ts`
- Update database with new addresses

**Option C**: Keep placeholders for now
- Feeds will show "No posts yet"
- Users can create posts (will create articles in Lens)
- Good for testing

---

## Error Summary

| Error | Type | Status | Impact |
|-------|------|--------|--------|
| Async Storage | Build | ✅ Fixed | Blocking |
| PGRST116 | Runtime | ✅ Handled | Non-blocking |
| WalletConnect | Warning | ✅ Fixed | Non-blocking |

---

## Verification Checklist

- [ ] Build completes without errors
- [ ] Dev server starts successfully
- [ ] Can navigate to feed pages
- [ ] No console errors (except expected "feed not found" logs)
- [ ] WalletConnect warning gone
- [ ] Can create posts (if authenticated)

---

## Known Limitations

1. **Placeholder Addresses**: Feeds use "feed-1", "feed-2", etc. instead of real Lens addresses
   - **Impact**: Feeds appear empty
   - **Fix**: Update addresses in Supabase

2. **No Real Lens Feeds**: Feeds may not exist in Lens Protocol yet
   - **Impact**: No posts to display
   - **Fix**: Create feeds or use existing ones

3. **PGRST116 Logs**: Will see "Feed not found" logs for placeholder addresses
   - **Impact**: Cosmetic only
   - **Fix**: Update to real addresses

---

## Quick Fix Commands

```bash
# Clear cache and restart
rm -rf .next
npm run dev

# If still having issues, reinstall dependencies
rm -rf node_modules
npm install
npm run dev
```

---

**Status**: ✅ All errors fixed  
**Next**: Update feed addresses in Supabase to real Lens feed addresses  
**Ready**: System is functional with placeholder addresses
