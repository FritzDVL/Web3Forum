# Future Roadmap - Society Protocol Forum

**Created**: 2026-03-01  
**Status**: Planning Phase  
**Current Version**: v1.0 (Core Loop Complete + Reply System Working)

---

## Table of Contents

1. [Critical Decision: Technical Section Architecture](#critical-decision-technical-section-architecture)
2. [Immediate Priorities](#immediate-priorities)
3. [Short-term Features](#short-term-features)
4. [Medium-term Features](#medium-term-features)
5. [Long-term Vision](#long-term-vision)
6. [Technical Debt](#technical-debt)

---

# Critical Decision: Technical Section Architecture

## Current Status
- 7 technical feeds with placeholder addresses (feed-20, feed-20a, feed-21, feed-22, feed-23, feed-23a, feed-23b)
- All marked as `is_locked: true`
- Topics: Architecture, State Machine, Consensus, Cryptography, Account System, Security

## 🎯 Three Architecture Options

### **Option 1: Token-Gated Feeds (Simplest)**

**How it works:**
- Keep 7 separate Lens Feeds
- Each feed has token-gating rule
- Users need token to post/view

**Pros:**
- ✅ Simplest to implement (30 min)
- ✅ Keeps current UI/UX
- ✅ Each topic has clear boundary
- ✅ Easy moderation per feed

**Cons:**
- ❌ Siloed discussions (no cross-pollination)
- ❌ 7 separate token-gate checks
- ❌ Rigid structure

**Implementation:**
```sql
-- Just update Supabase with real Lens Feed addresses
UPDATE feeds SET lens_feed_address = '0xTokenGatedFeed1' WHERE lens_feed_address = 'feed-20';
UPDATE feeds SET lens_feed_address = '0xTokenGatedFeed2' WHERE lens_feed_address = 'feed-20a';
-- Repeat for all 7
```

**Timeline:** 30 minutes (if you have token-gated feed addresses)

---

### **Option 2: Single Token-Gated Lens Group (Recommended)**

**How it works:**
- Create 1 Lens Group: "Society Protocol Research"
- Token-gate the entire group
- Use tags/categories for the 7 topics
- Posts are Lens Publications with metadata tags

**Pros:**
- ✅ **Cross-pollination**: Posts can have multiple tags
- ✅ Single token-gate check (better UX)
- ✅ More flexible organization
- ✅ Can add new topics without creating feeds
- ✅ Better for research (topics naturally overlap)
- ✅ Lens Groups have built-in moderation

**Cons:**
- ⚠️ Requires UI refactor (2-3 hours)
- ⚠️ Different pattern from other sections

**Implementation Steps:**

1. **Create Your Token** (1-2 hours)
```solidity
// Option A: Simple ERC-20 on Lens Chain
contract SocietyResearchToken is ERC20 {
  constructor() ERC20("Society Research", "SRES") {
    _mint(msg.sender, 1000000 * 10**18);
  }
}

// Option B: Use existing token/NFT you control
```

2. **Create Token-Gated Lens Group** (30 min)
```typescript
import { createGroup } from '@lens-protocol/client/actions';
import { TokenStandard } from '@lens-protocol/client';

const group = await createGroup(sessionClient, {
  name: "Society Protocol Research",
  description: "Token-gated research discussions for Society Protocol",
  rules: {
    anyOf: [{
      rule: {
        type: 'TOKEN_OWNERSHIP',
        token: {
          address: evmAddress('0xYourTokenAddress'),
          standard: TokenStandard.Erc20,
          chainId: lensChain.id,
        },
        minBalance: bigDecimal('1'), // Need at least 1 token
      }
    }]
  }
});
```

3. **Update UI** (2-3 hours)
```typescript
// Create TechnicalSection component
// Fetch posts from group
// Filter/organize by tags
// Show as categorized view with 7 topics

const topics = [
  { id: 'architecture', name: 'General Architecture', tag: 'architecture' },
  { id: 'objects', name: 'Architectural Objects & Functions', tag: 'objects' },
  { id: 'state-machine', name: 'State Machine', tag: 'state-machine' },
  { id: 'consensus', name: 'Consensus (Proof of Hunt)', tag: 'consensus' },
  { id: 'cryptography', name: 'Cryptography', tag: 'cryptography' },
  { id: 'account', name: 'Account System', tag: 'account' },
  { id: 'security', name: 'Security', tag: 'security' },
];

// Posts have tags in metadata
const metadata = {
  content: "Discussion about state machine...",
  tags: ["state-machine", "cryptography"], // Can have multiple!
  category: "technical"
};
```

**Timeline:** 3-4 hours total

---

### **Option 3: Hybrid - Group + Virtual Feeds**

**How it works:**
- Backend: Single token-gated Lens Group
- Frontend: Show as 7 separate "feeds" (virtual)
- Filter posts by tags to simulate feeds

**Pros:**
- ✅ Cross-pollination in backend
- ✅ Familiar UI (looks like separate feeds)
- ✅ Single token-gate
- ✅ Flexible tagging

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Posts can appear in multiple "feeds"

**Timeline:** 4-5 hours

---

## 💡 Recommendation: Option 2

**Why:**
1. Research discussions naturally overlap (Consensus involves Cryptography + State Machine)
2. Lens Groups have native, robust token-gating
3. Future-proof: Easy to add topics, reorganize
4. Better UX: One token check vs 7
5. Aligns with Lens Protocol best practices

**When to use:**
- If you have 1+ week before demo
- If you want best long-term architecture
- If cross-topic discussions are valuable

**When to use Option 1 instead:**
- If you need demo ready in 1-2 days
- If you already have token-gated feed addresses
- If strict topic separation is required

---

## 🛠️ Token Creation Guide

### Option A: Deploy Your Own ERC-20

**Contract:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SocietyResearchToken is ERC20, Ownable {
    constructor() ERC20("Society Research Token", "SRES") {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }
    
    // Mint more tokens to grant access
    function grantAccess(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

**Deploy:**
1. Use Remix IDE or Hardhat
2. Deploy to Lens Chain (or your preferred chain)
3. Mint tokens to addresses you want to grant access
4. Use contract address in Lens Group rules

### Option B: Use Existing Token/NFT

- Use any ERC-20 or ERC-721 you control
- Just need the contract address
- Set minimum balance requirement

---

## 🎯 Decision Checklist

Before choosing, answer:

1. **Timeline**: When do you need this for your boss?
   - < 2 days → Option 1
   - 1 week → Option 2
   - 2+ weeks → Option 2 or 3

2. **Token**: Do you want to create your own?
   - Yes → Need 1-2 hours for deployment
   - No → Use existing token

3. **Access Control**: Who should have access?
   - Small team → Manually mint tokens
   - Community → Token sale/distribution
   - Hybrid → Start small, expand later

4. **Discussion Style**: How do topics relate?
   - Separate → Option 1
   - Overlapping → Option 2
   - Mixed → Option 3

5. **UI Preference**: How should it look?
   - Like other sections (separate feeds) → Option 1 or 3
   - Unified research hub → Option 2

---

# Immediate Priorities

**Timeline**: 1-2 weeks  
**Goal**: Production readiness for demo

## 1. Decide on Technical Section Architecture (CRITICAL)

See above section. Must decide before proceeding.

## 2. Loading States & Skeletons (4 hours)

### Why
Better perceived performance and user experience.

### What to Build
- Skeleton loaders for feed lists
- Skeleton loaders for post lists
- Loading spinners for post creation
- Loading states for pagination
- Shimmer effects

### Files to Create
- `components/shared/skeleton-post.tsx`
- `components/shared/skeleton-feed.tsx`
- `components/shared/skeleton-reply.tsx`

### Implementation
```typescript
// components/shared/skeleton-post.tsx
export function SkeletonPost() {
  return (
    <div className="animate-pulse rounded-lg border p-6">
      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
      <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded"></div>
      <div className="mt-4 h-20 bg-gray-200 rounded"></div>
    </div>
  );
}
```

---

## 3. Error Boundaries (2 hours)

### Why
Graceful error handling prevents full app crashes.

### What to Build
- React error boundaries
- Error fallback UI
- Retry mechanisms
- Better error messages

### Files to Create
- `components/shared/error-boundary.tsx`
- `components/shared/error-fallback.tsx`

### Implementation
```typescript
// components/shared/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 4. Test Production Build (30 min)

### Commands
```bash
npm run build
npm start
```

### What to Check
- No build errors
- All features work
- Performance is good
- No console errors

---

## 5. Environment Setup Documentation (30 min)

### Create .env.example
```bash
# Lens Protocol
NEXT_PUBLIC_LENS_ENVIRONMENT=production

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Grove (Storage)
GROVE_API_KEY=

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=
```

### Create SETUP.md
- Installation steps
- Environment variables
- How to run locally
- How to deploy

---

## 6. README for Evaluators (30 min)

### What to Include
- What is Society Protocol Forum
- How to connect wallet
- How to get Lens account
- What features to test
- Known limitations
- Feedback channels

---

# Short-term Features

**Timeline**: 2-4 weeks  
**Goal**: Enhanced user experience

## 5. Search & Filter (6 hours)

### Features
- Search posts by title/content
- Filter by author
- Filter by date range
- Filter by popularity
- Sort options

### Files to Create
- `components/commons/search-bar.tsx`
- `components/commons/filter-dropdown.tsx`
- `lib/services/feed/search-feed-posts.ts`

### Implementation
```typescript
// lib/services/feed/search-feed-posts.ts
export async function searchFeedPosts(
  feedAddress: Address,
  query: string,
  filters?: {
    author?: Address;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'recent' | 'popular';
  }
): Promise<SearchResult>
```

---

## 6. User Profile Pages (8 hours)

### Features
- View user's posts
- View user's replies
- User bio and metadata
- Activity history
- Follow/unfollow (if Lens supports)

### Route
`/u/[username]` or `/u/[address]`

### Files to Create
- `app/u/[username]/page.tsx`
- `components/user/user-profile.tsx`
- `components/user/user-posts-list.tsx`
- `lib/services/user/get-user-profile.ts`
- `lib/services/user/get-user-posts.ts`

---

## 7. Post Editing (4 hours)

### Features
- Edit own posts
- Edit history (if needed)
- Update on Lens Protocol
- Revalidate cache

### Files to Create
- `app/commons/[address]/post/[postId]/edit/page.tsx`
- `components/commons/edit-post-form.tsx`
- `lib/services/feed/update-feed-post.ts`
- `hooks/feeds/use-feed-post-edit-form.ts`

### Implementation
```typescript
// lib/services/feed/update-feed-post.ts
export async function updateFeedPost(
  postId: string,
  updates: {
    title?: string;
    content?: string;
    summary?: string;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient
): Promise<UpdateResult>
```

---

## 8. Infinite Scroll (3 hours)

### Features
- Auto-load on scroll
- Replace "Load More" button
- Intersection Observer
- Loading indicator

### Files to Modify
- `components/commons/paginated-feed-posts-list.tsx`

### Implementation
```typescript
// Use Intersection Observer
const observerRef = useRef<IntersectionObserver>();
const lastPostRef = useCallback((node) => {
  if (isLoading) return;
  if (observerRef.current) observerRef.current.disconnect();
  
  observerRef.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && nextCursor) {
      loadMore();
    }
  });
  
  if (node) observerRef.current.observe(node);
}, [isLoading, nextCursor]);
```

---

# Medium-term Features

**Timeline**: 1-3 months  
**Goal**: Advanced functionality

## 9. Notifications System (2 weeks)

### Features
- Real-time notifications for replies
- Notification bell icon
- Notification list
- Mark as read
- Email notifications (optional)
- Push notifications (optional)

### Files to Create
- `app/notifications/page.tsx`
- `components/layout/notification-bell.tsx`
- `components/notifications/notification-list.tsx`
- `lib/services/notifications/get-notifications.ts`
- `lib/services/notifications/mark-as-read.ts`

### Implementation
- Use Lens Protocol notification API
- Poll for new notifications
- WebSocket for real-time (optional)

---

## 10. Rich Media Support (1 week)

### Features
- Image upload and display
- Video embeds (YouTube, Vimeo)
- GIF support
- Link previews
- File attachments

### Files to Create
- `components/commons/media-uploader.tsx`
- `components/commons/media-preview.tsx`
- `lib/services/media/upload-image.ts`

### Implementation
- Upload to IPFS/Grove
- Store URI in post metadata
- Display in post content

---

## 11. Post Reactions (1 week)

### Features
- Like/upvote posts
- Reaction counts
- User's reaction status
- Multiple reaction types (optional)

### Files to Create
- `components/commons/post-reactions.tsx`
- `lib/services/feed/react-to-post.ts`
- `hooks/feeds/use-post-reactions.ts`

### Implementation
```typescript
// Use Lens Protocol reactions
await addReaction(sessionClient, {
  post: postId(postId),
  reaction: PostReactionType.Upvote,
});
```

---

## 12. Moderation Tools (2 weeks)

### Features
- Report posts/replies
- Hide posts
- Delete posts (own posts)
- Ban users (admin only)
- Moderator dashboard

### Files to Create
- `app/admin/moderation/page.tsx`
- `components/moderation/report-button.tsx`
- `components/moderation/moderation-queue.tsx`
- `lib/services/moderation/report-content.ts`
- `lib/services/moderation/hide-content.ts`

---

# Long-term Vision

**Timeline**: 3-6 months  
**Goal**: Platform maturity

## 13. Analytics Dashboard (2 weeks)

### Features
- Post views tracking
- User engagement metrics
- Popular posts/feeds
- Growth charts
- User retention

### Implementation
- Integrate with analytics service (Plausible, Umami)
- Track events client-side
- Dashboard for admins

---

## 14. Mobile App (2-3 months)

### Features
- React Native app
- iOS and Android
- Push notifications
- Offline support
- Native feel

### Tech Stack
- React Native
- Expo
- Lens Protocol SDK
- WalletConnect

---

## 15. Advanced Search (1 week)

### Features
- Full-text search
- Fuzzy matching
- Search suggestions
- Search history
- Advanced filters

### Implementation
- Integrate with search service (Algolia, Meilisearch)
- Index posts and replies
- Real-time updates

---

## 16. Gamification (2 weeks)

### Features
- User reputation points
- Badges and achievements
- Leaderboards
- Rewards for contributions
- NFT badges

### Implementation
- Track user actions
- Award points
- Mint NFT badges on milestones

---

# Technical Debt

**Priority**: Ongoing

## Code Quality

### 1. Remove Deprecated Code
- Clean up unused components
- Remove old config files
- Delete commented code

### 2. Add Tests
- Unit tests for services
- Integration tests for flows
- E2E tests for critical paths

### 3. Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction

### 4. Documentation
- API documentation
- Component documentation
- Architecture diagrams
- Deployment guide

---

# Implementation Priority Matrix

## High Priority (Do First)
1. Loading States & Skeletons
2. Error Boundaries
3. Update Placeholder Addresses
4. Optimistic Updates

## Medium Priority (Do Next)
5. Search & Filter
6. User Profile Pages
7. Post Editing
8. Infinite Scroll

## Low Priority (Nice to Have)
9. Notifications System
10. Rich Media Support
11. Post Reactions
12. Moderation Tools

## Future (Long-term)
13. Analytics Dashboard
14. Mobile App
15. Advanced Search
16. Gamification

---

# Success Metrics

## User Engagement
- Daily active users
- Posts per day
- Replies per post
- Time spent on site
- Return rate

## Technical Performance
- Page load time < 2s
- Time to interactive < 3s
- Lighthouse score > 90
- Error rate < 1%
- Uptime > 99.9%

## Business Goals
- User growth rate
- Content creation rate
- Community health
- Platform adoption

---

# Deployment Strategy

## Phase 1: Beta Launch (Week 1-2)
- Deploy with current features
- Invite beta testers
- Collect feedback
- Fix critical bugs

## Phase 2: Public Launch (Week 3-4)
- Implement high-priority polish
- Marketing push
- Monitor performance
- Scale infrastructure

## Phase 3: Feature Expansion (Month 2-3)
- Roll out medium-priority features
- A/B test new features
- Iterate based on data

## Phase 4: Platform Maturity (Month 4-6)
- Implement long-term vision
- Optimize performance
- Build community
- Expand ecosystem

---

**Document Status**: ✅ Planning Complete  
**Next Review**: After beta launch feedback  
**Priority**: Focus on immediate priorities first
