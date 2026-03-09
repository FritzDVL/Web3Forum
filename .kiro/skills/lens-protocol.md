---
name: lens-protocol-quick-reference
description: Quick reference for Lens Protocol SDK. Use when implementing Lens features like posts, reactions, profiles.
---

# Lens Protocol Quick Reference

## Authentication Pattern

Every Lens action requires authentication:

```typescript
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";

const sessionClient = useSessionClient();
const walletClient = useWalletClient();

// Always check both before Lens actions
if (!sessionClient.data) {
  toast.error("Not logged in");
  return;
}

if (!walletClient.data) {
  toast.error("Wallet not connected");
  return;
}
```

## Common Lens Actions

### 1. Add Reaction (Like/Upvote)
```typescript
import { addReaction } from "@lens-protocol/client/actions";
import { PostReactionType, postId } from "@lens-protocol/client";

const result = await addReaction(sessionClient.data, {
  post: postId(postId),
  reaction: PostReactionType.Upvote
});

if (result.isErr()) {
  console.error(result.error);
  return;
}
// Success!
```

### 2. Remove Reaction
```typescript
import { undoReaction } from "@lens-protocol/client/actions";

const result = await undoReaction(sessionClient.data, {
  post: postId(postId),
  reaction: PostReactionType.Upvote
});
```

### 3. Fetch Post
```typescript
import { fetchPost } from "@lens-protocol/client/actions";

const postResult = await fetchPost(sessionClient.data, {
  post: postId(postId)
});

if (postResult.isErr()) {
  console.error(postResult.error);
  return;
}

const post = postResult.value;
// Access: post.stats.upvotes, post.operations.hasUpvoted, etc.
```

### 4. Fetch Account
```typescript
import { fetchAccount } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";

const accountResult = await fetchAccount(client, {
  address: evmAddress(address)
});

if (accountResult.isErr()) {
  console.error(accountResult.error);
  return;
}

const account = accountResult.value;
// Access: account.username, account.metadata.picture, etc.
```

### 5. Join Community
```typescript
import { joinCommunity } from "@/lib/services/membership/join-community";

const result = await joinCommunity(
  community,
  sessionClient.data,
  walletClient.data
);

if (result.success) {
  toast.success("Joined community!");
} else {
  toast.error(result.error);
}
```

## Common Types

```typescript
import {
  Post,
  Account,
  PostId,
  PostReactionType,
  Notification
} from "@lens-protocol/client";

// PostId format: "0x01-0x02"
// Use postId() helper to convert strings
import { postId } from "@lens-protocol/client";
const id: PostId = postId("0x01-0x02");
```

## Error Handling Pattern

```typescript
const result = await lensAction(sessionClient.data, params);

if (result.isErr()) {
  console.error("Lens error:", result.error);
  toast.error("Action failed", {
    description: result.error.message
  });
  return;
}

// Success - use result.value
const data = result.value;
```

## Common Hooks

```typescript
// Get current session
const sessionClient = useSessionClient();
const isAuthenticated = !!sessionClient.data;

// Get wallet
const walletClient = useWalletClient();
const isWalletConnected = !!walletClient.data;

// Get current account
const { account } = useAuthStore();
```

## Post Stats Structure

```typescript
post.stats = {
  upvotes: number,
  downvotes: number,
  comments: number,
  quotes: number,
  reposts: number
}

post.operations = {
  hasUpvoted: boolean,
  hasDownvoted: boolean,
  hasCommented: boolean
}
```

## Account Structure

```typescript
account = {
  address: string,
  username: {
    value: string,        // Full username with namespace
    localName: string     // Just the name part
  },
  metadata: {
    name: string,
    bio: string,
    picture: string,      // Avatar URL
    coverPicture: string
  }
}
```

## Best Practices

1. **Always check authentication first**
   ```typescript
   if (!sessionClient.data || !walletClient.data) return;
   ```

2. **Use toast for user feedback**
   ```typescript
   toast.loading("Processing...");
   toast.success("Done!");
   toast.error("Failed!");
   ```

3. **Handle errors gracefully**
   ```typescript
   if (result.isErr()) {
     console.error(result.error);
     toast.error("Action failed");
     return;
   }
   ```

4. **Use the postId helper**
   ```typescript
   import { postId } from "@lens-protocol/client";
   const id = postId(stringId);
   ```

5. **Check operations before showing UI**
   ```typescript
   const hasLiked = post.operations?.hasUpvoted ?? false;
   ```

---

**Note:** This is a quick reference. For full documentation, see:
- Lens Protocol Docs: https://docs.lens.xyz
- Lens React SDK: https://docs.lens.xyz/docs/sdk-react-intro

**Add more documentation here as needed!**
