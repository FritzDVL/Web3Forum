# Updated Priority List - Society Protocol Forum

**Date**: 2026-02-28  
**Current Status**: Feeds system functional, dynamic database-driven architecture ✅

---

## 📊 Current State Analysis

### ✅ What's Working
1. **Homepage**: Dynamically loads 28 feeds from Supabase database
2. **Feed Detail Pages**: `/commons/[address]` displays feed metadata
3. **Post Creation**: `/commons/[address]/new-post` creates posts in Lens Protocol
4. **Post Display**: Fetches and displays posts from Lens Protocol
5. **Database**: Fully seeded with 28 feeds, proper schema
6. **Architecture**: Clean service layer, adapter pattern, proper separation of concerns
7. **Dynamic System**: No hardcoded addresses, database is single source of truth

### ❌ What's Missing
1. **Post Detail Pages**: Can't view individual post with comments
2. **Pagination**: Only shows first 10 posts per feed
3. **Reply System**: Can't reply to posts
4. **Search/Filter**: No way to search posts or filter by criteria
5. **User Profiles**: No user profile pages
6. **Notifications**: No notification system
7. **Post Editing**: Can't edit posts after creation
8. **Rich Media**: Limited image/video support

### ⚠️ Known Issues
1. Some feeds still have placeholder addresses (`feed-20`, `feed-21`, `feed-22`, `feed-23`, `feed-26`)
2. No loading states during post fetch
3. No error boundaries for graceful failures
4. No optimistic UI updates

---

## 🎯 Recommended Priority List

### **TIER 1: Critical User Experience (Complete the Core Loop)**

These features are essential for a functional forum experience.

#### 1. Post Detail Pages (2-3 hours) 🔥 **HIGHEST PRIORITY**
**Why**: Users can see posts but can't click to read full content or see replies  
**Impact**: Completes the basic read flow  
**Route**: `/commons/[address]/post/[postId]`

**Implementation**:
- Create `app/commons/[address]/post/[postId]/page.tsx`
- Fetch single post from Lens Protocol
- Display full post content with metadata
- Show reply count and preview
- Add "Reply" button

**Files to create**:
- `app/commons/[address]/post/[postId]/page.tsx`
- `lib/services/feed/get-feed-post.ts`
- `components/commons/post-detail.tsx`

---

#### 2. Reply System (3-4 hours) 🔥 **HIGH PRIORITY**
**Why**: Forums need conversations, not just posts  
**Impact**: Enables actual discussions  

**Implementation**:
- Add reply form to post detail page
- Fetch replies from Lens Protocol
- Display threaded replies
- Support nested replies (1 level deep)

**Files to create/modify**:
- `lib/services/feed/create-feed-reply.ts`
- `lib/services/feed/get-feed-replies.ts`
- `components/commons/reply-form.tsx`
- `components/commons/reply-list.tsx`
- `hooks/feeds/use-feed-reply-form.ts`

---

#### 3. Pagination (1-2 hours) 🟡 **MEDIUM PRIORITY**
**Why**: Feeds with >10 posts are truncated  
**Impact**: Users can browse all content  

**Implementation**:
- Add "Load More" button to feed pages
- Use Lens API cursor pagination
- Update `get-feed-posts.ts` to handle cursors
- Add loading state

**Files to modify**:
- `lib/services/feed/get-feed-posts.ts`
- `components/commons/feed-posts-list.tsx`
- Add `components/commons/load-more-button.tsx`

---

### **TIER 2: Polish & Usability (Make it Feel Good)**

These improve the experience but aren't blocking.

#### 4. Loading States & Skeletons (1 hour) 🟡 **MEDIUM PRIORITY**
**Why**: Currently shows blank screen while loading  
**Impact**: Better perceived performance  

**Implementation**:
- Add skeleton loaders for feed lists
- Add loading spinners for post creation
- Add loading states for pagination

**Files to create**:
- `components/shared/skeleton-post.tsx`
- `components/shared/skeleton-feed.tsx`

---

#### 5. Error Boundaries & Better Error Handling (1 hour) 🟡 **MEDIUM PRIORITY**
**Why**: Errors crash the page or show generic messages  
**Impact**: Graceful degradation  

**Implementation**:
- Add React error boundaries
- Improve error messages
- Add retry mechanisms
- Add fallback UI

**Files to create**:
- `components/shared/error-boundary.tsx`
- `components/shared/error-fallback.tsx`

---

#### 6. Update Placeholder Feed Addresses (30 min) 🟢 **LOW PRIORITY**
**Why**: 5 feeds still have placeholder addresses  
**Impact**: Those feeds won't work until updated  

**Implementation**:
- Get real Lens feed addresses for:
  - `feed-20`: General Architecture Discussion
  - `feed-21`: State Machine
  - `feed-22`: Consensus (Proof of Hunt)
  - `feed-23`: Cryptography
  - `feed-26`: Economics
- Update database with real addresses

**SQL**:
```sql
UPDATE feeds SET lens_feed_address = '0xRealAddress' WHERE lens_feed_address = 'feed-20';
```

---

### **TIER 3: Advanced Features (Nice to Have)**

These add significant value but require more time.

#### 7. Search & Filter (2-3 hours) 🟢 **LOW PRIORITY**
**Why**: Hard to find specific posts  
**Impact**: Better content discovery  

**Implementation**:
- Add search bar to feed pages
- Filter by author, date, popularity
- Use Lens Protocol search API

---

#### 8. User Profile Pages (3-4 hours) 🟢 **LOW PRIORITY**
**Why**: Can't view user's post history  
**Impact**: Better community engagement  

**Implementation**:
- Create `/u/[username]` route
- Fetch user's posts from Lens
- Display user metadata
- Show activity history

---

#### 9. Post Editing (2 hours) 🟢 **LOW PRIORITY**
**Why**: Can't fix typos after posting  
**Impact**: Better content quality  

**Implementation**:
- Add "Edit" button to own posts
- Reuse post creation form
- Update post in Lens Protocol

---

#### 10. Rich Media Support (3-4 hours) 🟢 **LOW PRIORITY**
**Why**: Limited image/video embedding  
**Impact**: More engaging content  

**Implementation**:
- Add image upload to post form
- Support video embeds
- Add markdown preview
- Support GIFs, embeds

---

### **TIER 4: Future Enhancements (Post-MVP)**

These are strategic but not urgent.

#### 11. Notifications System (1 week)
- Real-time notifications for replies
- Email notifications
- Push notifications

#### 12. Moderation Tools (1 week)
- Report posts
- Hide/delete posts
- Ban users
- Moderator dashboard

#### 13. Analytics Dashboard (1 week)
- Post views tracking
- User engagement metrics
- Popular posts/feeds
- Growth charts

---

## 🎯 Recommended Next Steps

### **Option A: Complete Core Loop (Recommended)**
**Goal**: Make the forum fully functional for basic use  
**Time**: 5-7 hours  
**Order**:
1. Post Detail Pages (2-3h)
2. Reply System (3-4h)

**Result**: Users can read posts, reply, and have conversations

---

### **Option B: Polish First**
**Goal**: Make current features feel polished  
**Time**: 3-4 hours  
**Order**:
1. Loading States (1h)
2. Error Boundaries (1h)
3. Pagination (1-2h)

**Result**: Current features work smoothly, but still can't reply

---

### **Option C: Quick Wins**
**Goal**: Fix obvious gaps quickly  
**Time**: 2-3 hours  
**Order**:
1. Update placeholder addresses (30m)
2. Pagination (1-2h)
3. Loading states (1h)

**Result**: All feeds work, can browse all posts, better UX

---

## 💡 My Recommendation: **Option A - Complete Core Loop**

### Why?
1. **User Value**: Post detail + replies = actual forum functionality
2. **Momentum**: You've built the foundation, now complete the experience
3. **Testing**: Can't properly test the system without full read/write loop
4. **Feedback**: Need working replies to get meaningful user feedback

### Implementation Order:
```
Day 1 (2-3 hours):
✅ Post Detail Pages
   - Route: /commons/[address]/post/[postId]
   - Full post view
   - Reply preview

Day 2 (3-4 hours):
✅ Reply System
   - Reply form
   - Reply list
   - Nested replies (1 level)

Day 3 (1-2 hours):
✅ Pagination
   - Load more button
   - Cursor-based pagination

Day 4 (1 hour):
✅ Polish
   - Loading states
   - Error handling
```

**Total Time**: 7-10 hours  
**Result**: Fully functional forum with read/write/reply capabilities

---

## 📈 Success Metrics

After completing Option A, you'll have:

✅ **Complete User Flow**:
- Browse feeds → Click post → Read full content → Reply → See reply

✅ **Core Features**:
- Post creation ✅
- Post display ✅
- Post detail ✅ (NEW)
- Reply system ✅ (NEW)
- Pagination ✅ (NEW)

✅ **Production Ready**:
- All critical paths working
- Error handling in place
- Loading states implemented
- Database-driven architecture

---

## 🚀 After Option A: What's Next?

Once core loop is complete, you can:

1. **Launch Beta**: Get real users testing
2. **Gather Feedback**: See what features users actually want
3. **Iterate**: Build based on real usage data
4. **Scale**: Add advanced features based on demand

---

## 📝 Notes

- **Communities vs Feeds**: Communities already have full functionality (threads, replies, etc.). Feeds are catching up.
- **Lens Protocol**: All post/reply operations use Lens Protocol primitives
- **Database**: Supabase used for caching and metadata only
- **Architecture**: Service layer pattern makes adding features straightforward

---

**Recommendation**: Start with **Post Detail Pages** (2-3 hours)  
**Next**: **Reply System** (3-4 hours)  
**Then**: **Pagination** (1-2 hours)

This gives you a complete, functional forum in ~7-10 hours of work.
