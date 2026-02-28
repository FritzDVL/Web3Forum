# Future Roadmap - Society Protocol Forum

**Created**: 2026-03-01  
**Status**: Planning Phase  
**Current Version**: v1.0 (Core Loop Complete)

---

## Table of Contents

1. [Immediate Priorities](#immediate-priorities)
2. [Short-term Features](#short-term-features)
3. [Medium-term Features](#medium-term-features)
4. [Long-term Vision](#long-term-vision)
5. [Technical Debt](#technical-debt)

---

# Immediate Priorities

**Timeline**: 1-2 weeks  
**Goal**: Polish and production readiness

## 1. Loading States & Skeletons (4 hours)

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

## 2. Error Boundaries (2 hours)

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

## 3. Optimistic Updates (3 hours)

### Why
Instant feedback improves user experience.

### What to Build
- Optimistic reply creation
- Optimistic post creation
- Rollback on error
- Loading indicators

### Files to Modify
- `hooks/feeds/use-feed-reply-form.ts`
- `hooks/feeds/use-feed-post-create-form.ts`

### Implementation
```typescript
// Optimistic reply
const optimisticReply = {
  id: 'temp-' + Date.now(),
  content,
  author: currentUser,
  timestamp: new Date().toISOString(),
};

// Add to UI immediately
setReplies([...replies, optimisticReply]);

// Then create on blockchain
const result = await createReply(...);

// Replace temp with real
if (result.success) {
  setReplies(replies.map(r => 
    r.id === optimisticReply.id ? result.reply : r
  ));
}
```

---

## 4. Update Placeholder Addresses (30 min)

### Why
5 feeds still have placeholder addresses.

### What to Do
Get real Lens feed addresses for:
- feed-20: General Architecture Discussion
- feed-21: State Machine
- feed-22: Consensus (Proof of Hunt)
- feed-23: Cryptography
- feed-26: Economics

### SQL
```sql
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-20';
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-21';
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-22';
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-23';
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-26';
```

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
