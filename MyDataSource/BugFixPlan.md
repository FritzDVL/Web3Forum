# Bug Fix Plan - Web3 Forum

## Overview
This document expands on the bugs identified in Feedback.md and clarifies the implementation plan for each issue.

**Analysis Date:** March 9, 2026  
**Codebase:** Web3Forum (LensForum rebrand + communities)

---

## 🔍 Key Findings from Codebase Analysis

### Existing Working Patterns (Communities Section)
The communities section has fully functional implementations for:
- ✅ **Voting system** - `hooks/common/use-voting.ts` with upvote/downvote
- ✅ **Join/Leave community** - `hooks/communities/use-join-community.ts` & `use-leave-community.ts`
- ✅ **Switch account** - `hooks/auth/use-switch-account.ts`
- ✅ **Notifications** - `hooks/notifications/use-notifications.ts` + full UI components
- ✅ **Avatar display** - `components/ui/avatar.tsx` + `components/notifications/avatar-profile-link.tsx`
- ✅ **User search** - `components/ui/user-search.tsx` with `hooks/editor/use-account-search.ts`
- ✅ **Profile stats** - `components/profile/profile-stats.tsx` (followers, following, posts, reputation)

### The Problem
These features work in the **communities section** but are either:
1. Not implemented in the main forum/feed sections
2. Implemented but broken/not connected properly
3. UI exists but backend logic missing

---

## 1. Links Don't Work / No Embed Functionality

**Current State:**
- Links in posts are not clickable or don't work properly
- No way to embed content (images, videos, etc.)
- ContentRenderer component exists (`components/shared/content-renderer`) but may not handle links

**What We're Doing:**
- [ ] Check ContentRenderer implementation for link handling
- [ ] Add clickable link support with proper URL parsing
- [ ] Add embed support for images/videos (optional)
- [ ] Test with various link formats

**Priority:** Medium 

---

## 2. Unclear Error Messages

**Current State:**
- When description is missing, post creation fails silently
- No clear feedback to user about what went wrong
- Form validation exists but error messages not displayed properly

**What We're Doing:**
- [ ] Add proper form validation with clear error messages
- [ ] Use toast notifications (sonner already integrated) for errors
- [ ] Add inline field validation for required fields
- [ ] Pattern: Follow the error handling in `use-voting.ts` and `use-join-community.ts`

**Priority:** High (UX critical)

**Reference Code:**
```typescript
// Pattern from use-join-community.ts
if (!sessionClient.data) {
  toast.error("Not logged in", {
    description: "Please log in to join communities.",
  });
  return false;
}
```

---

## 3. No Search Functionality

**Current State:**
- No search anywhere in the forum
- Spanish section has search but unclear if functional
- **SOLUTION EXISTS:** `components/ui/user-search.tsx` + `hooks/editor/use-account-search.ts`

**What We're Doing:**
- [ ] Implement user search using existing `UserSearch` component
- [ ] Add search to main forum/feed pages
- [ ] Consider adding post/thread search (future enhancement)
- [ ] Reuse pattern from communities section

**Priority:** Medium

**Reference Files:**
- `components/ui/user-search.tsx` - Full search UI with avatar display
- `hooks/editor/use-account-search.ts` - Search logic

---

## 4. No Upvotes/Downvotes Functionality

**Current State:**
- No voting system to sort forum topics
- Can't gauge post popularity or quality
- **SOLUTION EXISTS:** `hooks/common/use-voting.ts` + voting components

**What We're Doing:**
- [ ] Integrate `use-voting` hook into feed posts
- [ ] Add voting UI components (already exist: `reply-voting.tsx`, `thread-voting.tsx`)
- [ ] Connect to Lens Protocol reactions (addReaction/undoReaction)
- [ ] Add sorting by vote score

**Priority:** High (core feature)

**Reference Files:**
- `hooks/common/use-voting.ts` - Complete voting logic with Lens Protocol
- `components/reply/reply-voting.tsx` - Voting UI for replies
- `components/thread/thread-voting.tsx` - Voting UI for threads

**Implementation Pattern:**
```typescript
const { hasUserUpvoted, hasUserDownvoted, scoreState, handleUpvote, handleDownvote, isLoading } = useVoting({
  postid: post.id,
  upvoteLabel: "Upvote",
  downvoteLabel: "Downvote"
});
```

---

## 5. Switch Account Doesn't Work

**Current State:**
- Switch account functionality is broken
- **SOLUTION EXISTS:** `hooks/auth/use-switch-account.ts`

**What We're Doing:**
- [ ] Debug why switch account is failing
- [ ] Check if `useSwitchAccount` hook is properly connected to UI
- [ ] Verify Lens session management in auth store
- [ ] Test account switching flow end-to-end

**Priority:** High (authentication critical)

**Reference Files:**
- `hooks/auth/use-switch-account.ts` - Complete implementation exists
- `stores/auth-store` - Auth state management

**Existing Implementation:**
```typescript
const { switchLensAccount, isLoading } = useSwitchAccount();
// Handles: Lens account switch + session update + account fetch
```

---

## 6. Notifications Completely Broken

**Current State:**
- Notifications don't work for: replies, likes, mentions, rewards
- System exists but not functional
- **SOLUTION EXISTS:** Full notification system in place

**What We're Doing:**
- [ ] Debug `hooks/notifications/use-notifications.ts`
- [ ] Check if `getAllNotifications` service is working
- [ ] Verify Lens Protocol notification API integration
- [ ] Test notification types: mentions, comments, reactions
- [ ] Check if notifications page (`app/notifications/page.tsx`) is accessible

**Priority:** High (engagement critical)

**Reference Files:**
- `hooks/notifications/use-notifications.ts` - Hook implementation
- `lib/services/notifications/get-all-notifications.ts` - Service layer
- `app/notifications/page.tsx` - Full notifications page
- `components/notifications/` - Complete UI components:
  - `notifications-filter.tsx`
  - `notifications-list.tsx`
  - `mention-notification-item.tsx`
  - `avatar-profile-link.tsx`

**Debug Checklist:**
- [ ] Check if sessionClient is authenticated
- [ ] Verify Lens Protocol API permissions
- [ ] Check network requests in browser dev tools
- [ ] Test with different notification types

---

## 7. Can't Edit Profile

**Current State:**
- No way to edit user profile
- Lens data displays correctly but can't modify
- Profile is pulled from Lens Protocol (read-only by design?)

**What We're Doing:**
- [ ] Clarify: Is profile editing needed or is Lens profile the source of truth?
- [ ] If needed: Add profile edit form for local metadata
- [ ] Consider: Lens profiles are managed on Lens Protocol, not locally
- [ ] Alternative: Link to Lens profile management

**Priority:** Low (may be by design)

**Note:** Lens Protocol profiles are typically managed through the Lens app, not third-party apps. Verify if this is actually a bug or expected behavior.

---

## 8. Spanish Section - Can't Create Posts

**Current State:**
- Spanish section has search but no post creation
- Approval system unclear
- May be a permissions/membership issue

**What We're Doing:**
- [ ] Check community membership requirements for Spanish section
- [ ] Verify if post creation is gated by membership status
- [ ] Check if `joinCommunity` is working for Spanish community
- [ ] Add clear UI feedback about membership requirements

**Priority:** Medium

**Reference:**
- `hooks/communities/use-join-community.ts` - Join logic
- Check community config for Spanish section

---

## 9. Unable to Join Communities

**Current State:**
- Join button doesn't work for communities (e.g., Spanish Community)
- **SOLUTION EXISTS:** `hooks/communities/use-join-community.ts`

**What We're Doing:**
- [ ] Debug `useJoinCommunity` hook integration
- [ ] Check if wallet is connected when joining
- [ ] Verify Lens Protocol membership API calls
- [ ] Check `components/communities/display/join-community-button.tsx`
- [ ] Test join flow with proper error logging

**Priority:** High (core feature)

**Reference Files:**
- `hooks/communities/use-join-community.ts` - Join logic
- `hooks/communities/use-leave-community.ts` - Leave logic
- `components/communities/display/join-community-button.tsx` - UI component

**Debug Pattern:**
```typescript
const join = useJoinCommunity(community);
// Check: sessionClient.data exists
// Check: walletClient.data exists
// Check: joinCommunity service call succeeds
```

---

## 10. Posts Section Shows "0 Posts"

**Current State:**
- Post count displays "0 posts" even when posts exist and are visible
- Stats component exists and works in communities
- **SOLUTION EXISTS:** `components/profile/profile-stats.tsx`

**What We're Doing:**
- [ ] Debug `getAccountStats` service call
- [ ] Check if Lens Protocol feedStats API is returning correct data
- [ ] Verify stats calculation in `hooks/profile/use-profile-data.ts`
- [ ] Check database migration: `20250624110308_add_posts_count_colum_to_threads.sql`
- [ ] Verify triggers for updating post counts

**Priority:** Medium (visual bug)

**Reference Files:**
- `components/profile/profile-stats.tsx` - Stats display
- `hooks/profile/use-profile-data.ts` - Stats fetching (line ~18690)
- Database: `supabase/migrations/20250624110308_add_posts_count_colum_to_threads.sql`

**Stats Structure:**
```typescript
stats: { 
  followers: number; 
  following: number; 
  posts: number; // This is showing 0
}
```

---

## 11. Lens Avatar Missing from Posts

**Current State:**
- Avatar shows in profile but not in post display
- **SOLUTION EXISTS:** `components/notifications/avatar-profile-link.tsx`

**What We're Doing:**
- [ ] Add avatar component to post/feed items
- [ ] Reuse `AvatarProfileLink` component from notifications
- [ ] Ensure author data is passed to post components
- [ ] Pattern: Same as notification items

**Priority:** Low (visual enhancement)

**Reference Files:**
- `components/ui/avatar.tsx` - Base avatar component
- `components/notifications/avatar-profile-link.tsx` - Avatar with profile link

**Implementation Pattern:**
```typescript
<AvatarProfileLink author={post.author} />
// Handles: avatar image, fallback, profile link
``` 

---

## Features to Remove

### Remove Rewards Functionality
**Current State:**
- Displays GHO rewards
- Not part of current plan
- Page exists: `app/rewards/page.tsx`

**What We're Doing:**
- [ ] Remove rewards page and route
- [ ] Remove rewards components (`components/rewards/`)
- [ ] Remove rewards hooks (`hooks/rewards/`)
- [ ] Remove rewards from navigation
- [ ] Remove rewards from notifications filter

**Priority:** Medium

**Files to Remove:**
- `app/rewards/page.tsx`
- `components/rewards/*`
- `hooks/rewards/*`
- References in navigation/notifications

---

### Remove/Reconsider Reputation Feature
**Current State:**
- No plan or use without sybil resistance
- EigenTrust mentioned but not viable
- Currently shows in profile stats as "0"

**What We're Doing:**
- [ ] Option 1: Remove reputation from profile stats entirely
- [ ] Option 2: Hide reputation (keep code for future)
- [ ] Remove reputation from `ProfileStats` component
- [ ] Clean up any reputation-related services

**Priority:** Low

**Reference:**
- `components/profile/profile-stats.tsx` - Shows reputation stat

---

### Cross-Posted Communities Flag
**Current State:**
- Flag exists but feature not implemented
- Unclear what this refers to

**What We're Doing:**
- [ ] Identify where this flag is used
- [ ] Remove if not needed
- [ ] Document if keeping for future

**Priority:** Low

---

## New Features to Add

### Security Measures
**Current State:**
- No security against bot spam
- Vulnerable to signature-only bot accounts
- Need rate limiting and spam prevention

**What We're Doing:**
- [ ] Add rate limiting for post creation
- [ ] Implement basic spam detection
- [ ] Add CAPTCHA or proof-of-humanity (optional)
- [ ] Monitor for suspicious activity patterns
- [ ] Consider Lens Protocol's built-in spam protection

**Priority:** High (security critical)

**Considerations:**
- Lens Protocol may have built-in spam protection
- Check if community membership provides some protection
- Rate limiting at API level
- Monitor for duplicate content

---

### Info Page
**Current State:**
- No explanation of how forum works, rules, decentralization
- Users don't understand the platform

**What We're Doing:**
- [ ] Create `/about` or `/info` page
- [ ] Add to navigation (next to notifications/theme toggle)
- [ ] Content to include:
  - How the decentralized forum works
  - Lens Protocol integration explanation
  - Community rules and guidelines
  - How to join communities
  - How voting works
  - Privacy and data ownership

**Priority:** Medium (onboarding)

**Implementation:**
- Create `app/info/page.tsx`
- Add link in header navigation
- Use markdown for easy content updates

---

### Partner Community Channels
**Current State:**
- No ability for partners to create their own channels
- Only admin can create communities?

**What We're Doing:**
- [ ] Clarify requirements: Who can create communities?
- [ ] Check existing admin tools for community creation
- [ ] Add partner/moderator role system
- [ ] Create community creation form
- [ ] Add approval workflow (if needed)

**Priority:** Low (future feature)

**Reference:**
- `hooks/communities/use-add-moderator.ts` - Moderator management exists
- Check admin permissions in codebase

---

## UI/Styling (Lower Priority)

### Channel Styling Differentiation
**Current State:**
- Channel styling looks same as posts
- Needs visual differentiation

**What We're Doing:**
- [ ] Add distinct styling for channel headers
- [ ] Use different background colors or borders
- [ ] Add channel icon/badge
- [ ] Improve visual hierarchy

**Priority:** Low

---

### Three-Tab Layout Idea
**Current State:**
- Feedback suggests: "General, Technical, and Communities" sections
- Current layout unclear

**What We're Doing:**
- [ ] Evaluate current navigation structure
- [ ] Design three-tab layout mockup
- [ ] Implement if approved
- [ ] Consider: Main feed, Technical section, Communities list

**Priority:** Low (design decision needed)

---

## Implementation Order

### Phase 1 - Critical Bugs (Week 1)
**Goal:** Fix broken core functionality

1. **Fix notifications system** (Bug #6)
   - Debug `use-notifications` hook
   - Verify Lens API integration
   - Test all notification types

2. **Fix join community** (Bug #9)
   - Debug `useJoinCommunity` hook
   - Test wallet connection
   - Verify membership flow

3. **Fix switch account** (Bug #5)
   - Debug `useSwitchAccount` hook
   - Test account switching
   - Verify session management

4. **Add error messages** (Bug #2)
   - Implement form validation
   - Add toast notifications
   - Test all error scenarios

---

### Phase 2 - Core Functionality (Week 2)
**Goal:** Add missing features that already have implementations

1. **Implement voting system** (Bug #4)
   - Integrate `use-voting` hook into feeds
   - Add voting UI components
   - Test upvote/downvote flow
   - Add sorting by votes

2. **Add search functionality** (Bug #3)
   - Integrate `UserSearch` component
   - Add to main pages
   - Test search results

3. **Fix post count display** (Bug #10)
   - Debug stats fetching
   - Verify database triggers
   - Test with real data

4. **Add avatars to posts** (Bug #11)
   - Integrate `AvatarProfileLink` component
   - Add to all post displays
   - Test avatar loading

---

### Phase 3 - Features & Cleanup (Week 3)
**Goal:** Remove unwanted features and add security

1. **Security measures** (New Feature)
   - Implement rate limiting
   - Add spam detection
   - Test protection mechanisms

2. **Remove rewards system** (Cleanup)
   - Remove rewards pages
   - Remove rewards components
   - Clean up navigation

3. **Remove/hide reputation** (Cleanup)
   - Update profile stats
   - Remove reputation logic

4. **Fix links in posts** (Bug #1)
   - Update ContentRenderer
   - Add link parsing
   - Test various link formats

---

### Phase 4 - UI/Polish & Documentation (Week 4)
**Goal:** Improve UX and onboarding

1. **Create info page** (New Feature)
   - Write content
   - Design page layout
   - Add to navigation

2. **Spanish section post creation** (Bug #8)
   - Debug membership requirements
   - Add clear UI feedback
   - Test post creation flow

3. **UI improvements** (Styling)
   - Channel styling differentiation
   - Consider three-tab layout
   - Polish overall design

4. **Profile editing** (Bug #7)
   - Clarify requirements
   - Implement if needed
   - Or document Lens profile management

---

## Testing Checklist

### For Each Bug Fix:
- [ ] Test with authenticated user
- [ ] Test with unauthenticated user
- [ ] Test with wallet connected/disconnected
- [ ] Test error scenarios
- [ ] Test on mobile
- [ ] Check console for errors
- [ ] Verify Lens Protocol API calls
- [ ] Test with multiple accounts

### Integration Testing:
- [ ] End-to-end user flow: signup → join community → create post → vote → notifications
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Security testing

---

## Key Technical Patterns Found

### 1. Hook Pattern for Lens Integration
```typescript
// All Lens features follow this pattern:
const sessionClient = useSessionClient();
const walletClient = useWalletClient();

// Check authentication
if (!sessionClient.data) {
  toast.error("Not logged in", { description: "..." });
  return;
}

// Check wallet
if (!walletClient.data) {
  toast.error("Wallet not connected", { description: "..." });
  return;
}

// Perform action with Lens Protocol
const result = await lensAction(sessionClient.data, walletClient.data, params);
```

### 2. Error Handling Pattern
```typescript
// Use sonner toast for all user feedback
toast.loading("Action in progress...");
try {
  const result = await action();
  if (result.isErr()) {
    throw new Error(result.error);
  }
  toast.success("Action completed!");
} catch (error) {
  toast.error("Action failed", { description: error.message });
} finally {
  toast.dismiss(loadingToastId);
}
```

### 3. Component Pattern
```typescript
// Separate concerns: hooks for logic, components for UI
export function Component() {
  const { data, loading, error, action } = useCustomHook();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <StatusBanner type="error" />;
  
  return <UI data={data} onAction={action} />;
}
```

---

## Notes & Questions

### Questions to Clarify:
1. **Profile editing:** Is this needed or is Lens profile the source of truth?
2. **Partner communities:** What are the requirements for partner community creation?
3. **Three-tab layout:** Is this approved or just an idea?
4. **Reputation system:** Remove completely or hide for future?
5. **Spanish section:** What are the membership requirements?

### Technical Debt:
- Many features exist but aren't connected to the main feed/forum sections
- Need to unify communities section patterns with main forum
- Consider refactoring to share more code between sections

### Performance Considerations:
- Lens Protocol API rate limits
- Database query optimization for post counts
- Caching strategy for frequently accessed data

### Security Considerations:
- Rate limiting implementation
- Spam detection algorithms
- User permission system
- Wallet signature verification

---

## Success Metrics

### Phase 1 Success:
- [ ] All notifications working
- [ ] Join community working
- [ ] Switch account working
- [ ] Clear error messages on all forms

### Phase 2 Success:
- [ ] Voting system functional on all posts
- [ ] Search returns accurate results
- [ ] Post counts display correctly
- [ ] Avatars show on all posts

### Phase 3 Success:
- [ ] No spam posts in 24-hour test period
- [ ] Rewards system completely removed
- [ ] Links clickable in all posts

### Phase 4 Success:
- [ ] Info page live and accessible
- [ ] User feedback positive on clarity
- [ ] All styling improvements complete

---

## Resources & References

### Key Files to Reference:
- `hooks/common/use-voting.ts` - Voting implementation
- `hooks/communities/use-join-community.ts` - Join logic
- `hooks/auth/use-switch-account.ts` - Account switching
- `hooks/notifications/use-notifications.ts` - Notifications
- `components/ui/user-search.tsx` - Search UI
- `components/notifications/avatar-profile-link.tsx` - Avatar component

### External Documentation:
- Lens Protocol API docs
- Lens Protocol React SDK
- Supabase documentation
- Wagmi documentation (wallet connection)

### Development Tools:
- Browser dev tools for debugging API calls
- React DevTools for component inspection
- Lens Protocol explorer for testing
- Supabase dashboard for database inspection 
