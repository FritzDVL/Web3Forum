# Lens Protocol: Post Visibility, Data Ownership & Privacy Limits

## The Core Truth: You Own All Your Data (And That's the Problem)

Your bet is correct. On Lens Protocol, **every post you make is permanently attached to your account**. This is by design — it's the fundamental promise of the protocol: you own your data, your social graph, your content. It's all onchain.

This means:

```
You post in a token-gated Group with 5 members
        ↓
The post is stored onchain, linked to your account address
        ↓
Anyone can call: fetchPosts({ filter: { authors: ["0xYourAddress"] } })
        ↓
Your post shows up — regardless of which feed or group it was posted to
```

There is **no way to make a post invisible on your account profile** while keeping it visible inside a group/feed. The Lens API exposes every post an account has ever made through the `fetchPosts` query filtered by author. No flag, no setting, no rule prevents this.

## What "Privacy" Actually Means on Lens

Lens Protocol's privacy model is about **write access control**, not **read access control**:

| What you CAN control | What you CANNOT control |
|---|---|
| Who can JOIN a group (GroupRules) | Who can READ posts once they exist onchain |
| Who can POST to a feed (FeedRules) | Whether posts appear on your profile |
| Who can LOG IN to your app (AuthEndpoint) | Whether someone queries the Lens API directly |
| Who can FOLLOW in your graph (GraphRules) | Whether posts show up in global explorers |

### The fetchPosts Query — No Gating

From the Lens docs, the `fetchPosts` query accepts these filters:
- `authors` — filter by account address
- `apps` — filter by which app created the post
- `feeds` — filter by feed (including `globalFeed: true`)
- `metadata` — filter by content type, tags
- `searchQuery` — text search
- `collectedBy` — who collected it
- `accountScore` — ML quality score

None of these filters enforce access control. They're just query parameters. Anyone with a Lens client can call `fetchPosts({ filter: { authors: ["0xYou"] } })` and see everything you've ever posted, across all feeds, all apps, all groups.

### The Delete Post Caveat

You CAN delete posts via `deletePost()`. But the docs explicitly warn:

> "Bear in mind that the trail of the Post existence will remain as part of the blockchain history."

Deleting removes the post from the Lens API/indexer responses, but the onchain transaction history is permanent. Someone running their own indexer or reading the chain directly could still find it.

### The Global Feed

When you create a post on any feed, it can appear in the global feed unless the app specifically filters it out. The `fetchPosts` query defaults to including all feeds. An app like Hey.xyz or any other Lens client will show your posts if they query by author.

## What This Means for Your Forum

### Scenario: Private Group Discussion

You create a Group with `MembershipApprovalGroupRule` and a Feed with `GroupGatedFeedRule`. Only approved members can post. Great.

But:
1. Member Alice posts a discussion in the group feed
2. Bob (not a member) goes to Hey.xyz, searches for Alice's profile
3. Bob sees Alice's post content — the text, images, everything
4. Bob just can't post or reply in that feed

The group-gating controls **who writes**, not **who reads**.

### Scenario: Authorization Endpoint

You set up an Authorization Endpoint that only allows approved accounts to log in to your app. Non-members can't use your app at all.

But:
1. They can still use Hey.xyz, Orb, or any other Lens client
2. They can query the Lens GraphQL API directly
3. They see all posts made by your community members

The auth endpoint controls **who uses your app**, not **who sees the data**.

## The Layers of "Privacy" You Can Stack

Even though true read-privacy doesn't exist on Lens, you can create practical obscurity:

### Layer 1: App-Level Filtering (What You Control)
Your app only shows posts from your feeds. Users of YOUR app see a curated, private-feeling experience. This is what most Lens apps do.

### Layer 2: Authorization Endpoint (Who Can Log In)
Non-members can't authenticate with your app. They can't post, react, or interact through your interface.

### Layer 3: App Verification (Anti-Impersonation)
Operations are signed with your app's key. Prevents bots from posting as if they're using your app.

### Layer 4: Feed Rules (Who Can Write)
GroupGatedFeedRule ensures only group members can create posts in your feeds.

### Layer 5: Content Strategy (What You Post)
Since content is public, the community can adopt practices like:
- Using the forum for coordination, not secrets
- Keeping sensitive discussions off-chain (Discord, Signal)
- Using the forum for public-facing research and governance

### What's NOT a Layer: Encryption
Lens Protocol does not currently support encrypted posts at the protocol level. The content metadata (stored on Grove/IPFS) is plain JSON. There's no built-in mechanism for end-to-end encrypted content that only group members can decrypt.

## Comparison With Traditional Forums

| Feature | Traditional Forum (Reddit, Discourse) | Lens Protocol Forum |
|---|---|---|
| Private subreddits/categories | Yes — server controls read access | No — all posts are publicly queryable |
| User owns their data | No — platform owns it | Yes — user owns it onchain |
| Portable identity | No — locked to platform | Yes — works across all Lens apps |
| Content survives platform shutdown | No | Yes — onchain forever |
| Admin can delete user content | Yes | Only the author can delete their own posts |
| Read access control | Full server-side control | None — blockchain is public |

## Practical Recommendation for Web3Forum

Given these constraints, the best approach for your close community is:

1. **Accept that content is public** — this is the tradeoff of decentralized, user-owned data
2. **Use write-gating aggressively** — GroupGatedFeedRule + MembershipApprovalGroupRule ensures only approved members contribute
3. **Use the Authorization Endpoint** — makes your app feel private even though the underlying data isn't
4. **Use App Verification** — prevents spam and impersonation
5. **Design content for public consumption** — treat the forum like a public square with a velvet rope for participation, not a private room
6. **Keep truly private discussions off-chain** — use encrypted messaging (Signal, Matrix) for sensitive topics

The forum becomes: **"Anyone can read, only members can write."** This is actually how most successful DAOs and onchain communities operate. The value isn't in hiding information — it's in curating who participates in the conversation.

## Technical Note: Future Possibilities

The Lens team could potentially add:
- Encrypted post metadata (content only decryptable by group members)
- Read-gated feeds (requiring token ownership to decrypt)
- Lit Protocol integration for access-controlled content

But as of the current protocol (V3), none of these exist at the protocol level. Any encryption would need to be implemented at the application layer, outside of Lens primitives.
