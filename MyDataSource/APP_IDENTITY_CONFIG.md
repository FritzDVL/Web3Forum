# App Identity Configuration Guide

**Date**: 2026-03-01  
**Issue**: Posts show "LensForum" instead of your app name  
**Location**: `lib/shared/constants.ts`

---

## Current Configuration

### App Addresses (Lens Protocol)

```typescript
// Mainnet
const MAINNET_APP_ADDRESS: Address = "0x30BB11c7A400cE65Fc13f345AA4c5FFC1C333603";

// Testnet
const TESTNET_APP_ADDRESS: Address = "0x9eD1562A4e3803964F3c84301b18d4E1944D340b";
```

**This is what determines which app posts appear under.**

### App Names

```typescript
export const APP_NAME = isTestnet ? "LensForumV1" : "LensForum";
```

---

## What Each Address Controls

### 1. `APP_ADDRESS`
- **What it does**: Identifies your app on Lens Protocol
- **Where it's used**: 
  - Login/authentication
  - Post creation
  - Filtering posts by app
- **Cost to change**: **FREE** (just a config change)
- **Impact**: Posts will show under your app name instead of "LensForum"

### 2. `BASE_FEED_ADDRESS`
- **What it does**: Default feed for the app
- **Where it's used**: Base feed operations
- **Cost to change**: **FREE** (just a config change)

### 3. `ADMIN_USER_ADDRESS`
- **What it does**: Admin account for the app
- **Where it's used**: Admin operations
- **Cost to change**: **FREE** (just a config change)

### 4. `LENS_CONTRACT_GROUP_MANAGER`
- **What it does**: Contract address for group management
- **Where it's used**: Community/group operations
- **Cost to change**: **FREE** (just a config change)
- **Note**: This is a Lens Protocol contract, probably don't change

---

## How to Change to Your App

### Option 1: Just Change the Name (Easiest)

**Cost**: FREE  
**Time**: 1 minute  
**Impact**: Cosmetic only

```typescript
// lib/shared/constants.ts
export const APP_NAME = isTestnet ? "YourAppTestnet" : "YourAppName";
```

This changes the display name but posts still use LensForum's app address.

---

### Option 2: Register Your Own Lens App (Recommended)

**Cost**: Gas fees (~$1-5 depending on network)  
**Time**: 10-15 minutes  
**Impact**: Full app identity

#### Steps:

1. **Register your app on Lens Protocol**
   - Go to Lens Protocol dashboard
   - Register a new app
   - Get your app address (0x...)

2. **Update constants.ts**
   ```typescript
   const MAINNET_APP_ADDRESS: Address = "0xYOUR_APP_ADDRESS_HERE";
   const TESTNET_APP_ADDRESS: Address = "0xYOUR_TESTNET_APP_ADDRESS";
   ```

3. **Update app name**
   ```typescript
   export const APP_NAME = isTestnet ? "YourAppTestnet" : "YourAppName";
   ```

4. **Rebuild and redeploy**
   ```bash
   npm run build
   ```

---

## What Happens When You Change

### If You Change APP_ADDRESS:

✅ **New posts** will show under your app name  
❌ **Old posts** will still show under "LensForum"  
✅ **No data loss** - all posts remain on blockchain  
✅ **No migration needed** - just a config change  

### If You Keep LensForum Address:

✅ **Everything works** as is  
✅ **No costs** involved  
✅ **Can change later** without issues  
❌ Posts show "LensForum" attribution  

---

## Recommendation

### For Development/Testing:
**Keep current config** - No need to spend crypto yet

### For Production Launch:
**Register your own app** - Professional identity

### Timeline:
```
Now → Keep LensForum config (FREE)
    ↓
Build & test features
    ↓
Ready for launch → Register your app ($1-5)
    ↓
Update config → Redeploy
```

---

## Files That Use APP_ADDRESS

1. `lib/shared/constants.ts` - Configuration
2. `hooks/auth/use-login.ts` - Authentication
3. `lib/external/lens/primitives/notifications.ts` - Notifications
4. `lib/external/lens/primitives/posts.ts` - Post filtering

**All automatically use the constant** - change once, applies everywhere.

---

## Other Variables to Consider

### APP_URL
```typescript
const MAINNET_APP_URL = "https://lensforum.xyz";
const TESTNET_APP_URL = "http://localhost:3000";
```

**Change this to your domain** when you deploy.

### Thread Content Prefix
```typescript
// lib/domain/threads/content.ts
export const THREAD_CONTENT_PREFIX = "LensForum Thread: ";
```

**Change this to your app name** for thread URLs.

---

## Cost Breakdown

| Action | Cost | Required? |
|--------|------|-----------|
| Change APP_NAME | FREE | Optional |
| Change APP_URL | FREE | Yes (for production) |
| Change THREAD_PREFIX | FREE | Optional |
| Register Lens App | $1-5 gas | Optional (for branding) |
| Change APP_ADDRESS | FREE | Optional (after registration) |

---

## Quick Change Checklist

If you want to rebrand now (FREE):

```typescript
// lib/shared/constants.ts

// 1. Change app name
export const APP_NAME = isTestnet ? "YourAppTestnet" : "YourAppName";

// 2. Change URLs (when you deploy)
const MAINNET_APP_URL = "https://yourapp.com";
const TESTNET_APP_URL = "http://localhost:3000";

// 3. Change thread prefix
// lib/domain/threads/content.ts
export const THREAD_CONTENT_PREFIX = "YourApp Thread: ";
```

Then rebuild:
```bash
npm run build
```

---

## My Recommendation

**For now**: Keep the LensForum config

**Why**:
1. ✅ No costs
2. ✅ Everything works
3. ✅ Can change anytime
4. ✅ Focus on building features

**When to change**:
- Ready for production launch
- Want professional branding
- Have budget for gas fees

**The change is simple** and can be done in 5 minutes when you're ready.

---

## Summary

**Current situation**: Posts show "LensForum" because you're using their app address

**To change**: Update `APP_ADDRESS` in `lib/shared/constants.ts`

**Cost**: FREE to change config, $1-5 to register your own Lens app

**Recommendation**: Keep current config until you're ready to launch

**Impact**: Only affects app attribution, not functionality

---

**Status**: No urgent action needed - can change anytime ✅
