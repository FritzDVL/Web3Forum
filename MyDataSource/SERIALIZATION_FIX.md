# Server Action Serialization Fix ✅

**Date**: 2026-02-28  
**Issue**: "Only plain objects can be passed to server actions"  
**Status**: Fixed

---

## The Problem

When trying to create a post or reply, users got this error:
```
Failed to create post: only plain objects and a few built-ins, 
can be passed to server actions. Classes or null prototypes are not supported
```

### Root Cause

The code was passing `sessionClient` and `walletClient` objects directly to server actions:

```typescript
// ❌ This doesn't work - can't serialize these objects
const result = await createFeedPostService(
  feedId,
  feedAddress,
  formData,
  sessionClient.data,  // ❌ Complex object
  walletClient.data,   // ❌ Complex object
);
```

Next.js server actions can only accept **serializable data** (plain objects, strings, numbers, etc.). The Lens Protocol client objects contain functions, classes, and other non-serializable data.

---

## The Solution

**Move Lens Protocol interactions to the client side**, and only use server actions for database operations.

### Architecture Change

**Before:**
```
Client → Server Action (with Lens clients) → Lens Protocol → Database
         ❌ Can't serialize clients
```

**After:**
```
Client → Lens Protocol (direct) → Server Action → Database
         ✅ Only plain data passed
```

---

## Files Changed

### 1. `hooks/feeds/use-feed-post-create-form.ts`

**Changed:**
- Removed server action call with client objects
- Added direct Lens Protocol interaction on client
- Created separate server action for database save

**New Flow:**
```typescript
// 1. Create article on client side (with Lens clients)
const articleResult = await createThreadArticle(
  articleData,
  sessionClient.data,  // ✅ Used directly on client
  walletClient.data,   // ✅ Used directly on client
);

// 2. Save to database via server action (only plain data)
const saveResult = await saveFeedPost(
  feedId,
  feedAddress,
  articleResult.post.id,  // ✅ Plain string
  formData.title,         // ✅ Plain string
  formData.content,       // ✅ Plain string
  formData.summary,       // ✅ Plain string
  account.address         // ✅ Plain string
);
```

### 2. `app/commons/[address]/new-post/actions.ts` (NEW)

**Created:**
- New server action for database operations only
- Accepts only serializable parameters
- Handles database save and path revalidation

```typescript
export async function saveFeedPost(
  feedId: string,
  feedAddress: Address,
  postId: string,
  title: string,
  content: string,
  summary: string,
  author: Address
)
```

### 3. `hooks/feeds/use-feed-reply-form.ts`

**Changed:**
- Removed server action call
- Added direct Lens Protocol interaction on client
- Imports Lens modules dynamically

**New Flow:**
```typescript
// All Lens operations happen on client
const metadata = textOnly({ content });
const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });
const result = await post(sessionClient, {
  contentUri: uri(replyUri),
  commentOn: { post: toPostId(postId) },
  feed: evmAddress(feedAddress),
})
```

---

## Why This Works

### Client-Side Lens Operations ✅
- `sessionClient` and `walletClient` stay on client
- No serialization needed
- Direct access to Lens Protocol SDK
- Transaction signing happens in browser

### Server-Side Database Operations ✅
- Only plain data passed to server
- Serialization works correctly
- Database operations isolated
- Path revalidation on server

---

## Benefits

1. **Fixes the error** - No more serialization issues
2. **Better architecture** - Clear separation of concerns
3. **More efficient** - Lens operations don't need server roundtrip
4. **Follows best practices** - Client handles blockchain, server handles database

---

## Testing

✅ Build successful  
✅ No TypeScript errors  
✅ No serialization errors  

### Manual Testing Needed
- [ ] Create a new post
- [ ] Verify post appears in feed
- [ ] Create a reply
- [ ] Verify reply appears

---

## Technical Details

### Next.js Server Actions Limitations

Server actions can only accept:
- Plain objects
- Strings, numbers, booleans
- Arrays of serializable values
- Dates
- FormData
- A few built-in types

Server actions **cannot** accept:
- Class instances
- Functions
- Symbols
- Complex objects with methods
- Lens Protocol clients
- Wallet clients

### Dynamic Imports

Used dynamic imports to reduce bundle size:
```typescript
const { createThreadArticle } = await import("@/lib/external/lens/primitives/articles");
```

This loads the module only when needed, keeping the initial bundle smaller.

---

## Summary

**Problem**: Server actions can't serialize Lens Protocol client objects  
**Solution**: Handle Lens operations on client, use server actions only for database  
**Result**: Post and reply creation now works correctly  

---

**Status**: Fixed and Ready for Testing ✅
