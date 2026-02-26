# Divergence Analysis: Old Documentation vs Current Reality

**Generated**: 2026-02-26  
**Purpose**: Identify what needs to be deleted or updated

---

## Summary

The old `Context.md` documented a **theoretical 3-tier architecture** with extensive Lens Protocol integration plans. The **actual codebase** has a complete UI but minimal backend integration. This document identifies what's obsolete.

---

## Old Context.md: What Was Documented

### 1. The 3-Tier Architecture (Theoretical)

| Tier | Name | Status in Reality |
|------|------|-------------------|
| Tier 1 | Public Commons | ✅ UI exists (5 sections, 28 feeds) |
| Tier 2 | Technical Vault | ❌ Not implemented |
| Tier 3 | Local Embassies | ❌ Not implemented |

**Verdict**: Tiers 2 and 3 are **vaporware**. Only Tier 1 UI exists.

### 2. Technical Mapping Table (Theoretical)

Old documentation claimed:

| UI Component | Lens V3 Primitive | Supabase Entity |
|--------------|-------------------|-----------------|
| Root Category | Lens Group | `root_categories` |
| Sub-Category | Lens Feed | `sub_categories` |
| Topic / Thread | Article Publication | `threads` |
| Reply / Post | Comment Publication | `replies` |

**Reality Check**:
- ❌ No `root_categories` table exists
- ❌ No `sub_categories` table exists
- ✅ `community_threads` table exists (for communities, not feeds)
- ❌ No `replies` table exists (no feed reply system)

**Verdict**: This mapping is **fictional**. The actual database has `communities` and `community_threads` for the community system only.

### 3. Engineering Guardrails (Accurate)

The old doc correctly documented:
- ✅ Next.js 14.2.x (avoid 15.x)
- ✅ React 18 (avoid 19)
- ✅ Transpile `connectkit` and `walletconnect`
- ✅ Disable Node.js polyfills

**Verdict**: This section is **accurate** and should be preserved.

### 4. Shadow Indexing Strategy (Theoretical)

Old doc described:
- Metadata prefix: `LearningLens: [Tier]`
- Fallback to Lens API on cache miss
- Flat reply structure

**Reality Check**:
- ❌ No feed indexing implemented
- ❌ No metadata prefix in use
- ❌ No feed reply system

**Verdict**: This is **aspirational**, not implemented.

### 5. Implementation Roadmap (Outdated)

Old doc listed phases:
- Phase 1: Deploy Lens Groups and Feeds
- Phase 2: Authentication (✅ DONE)
- Phase 3: Content Loop (❌ NOT DONE)

**Verdict**: Only authentication is complete.

---

## What's in codebase.md (911KB File)

The `codebase.md` is a **gitingest output** containing:
1. Full directory tree (accurate)
2. Complete file contents (accurate snapshot)
3. No architectural commentary (just raw code)

**Verdict**: `codebase.md` is a **reference dump**, not documentation. It's useful for AI context but not human-readable.

---

## Files That Should Be Deleted (Candidates)

### High Confidence (Unused on Landing Page)

These components are not imported by `app/page.tsx`:

```
components/home/featured-communities.tsx
components/home/hero-section.tsx (49 bytes, empty)
components/home/stats-bar.tsx
components/home/thread-list-item.tsx
components/home/thread-votes-display.tsx
components/home/threads-list.tsx
components/home/threads-switcher.tsx
```

**Reason**: Landing page only uses `forum-category.tsx`, `function-grid.tsx`, and `community-grid.tsx`.

### Medium Confidence (Community System)

If the new architecture is **feed-first** (not community-first), these may be redundant:

```
components/communities/ (entire directory, 40+ files)
  - display/
  - forms/
  - list/
  - rules/
  - settings/
  - threads/
```

**⚠️ CAUTION**: The "LOCAL" section on the landing page uses `community-grid.tsx` and fetches from `communities` table. Do not delete until confirming communities are separate from feeds.

### Low Confidence (May Be Needed)

These support the community system (LOCAL section):

```
app/communities/ (routes for community pages)
lib/services/community/ (12 files)
lib/domain/communities/ (types)
hooks/communities/ (13 files)
```

**Verdict**: **Keep** until feed system is fully implemented and LOCAL section is migrated.

---

## Database Schema Divergence

### What Old Docs Claimed

```sql
root_categories (for Lens Groups)
sub_categories (for Lens Feeds)
threads (for forum threads)
replies (for forum replies)
```

### What Actually Exists

```sql
communities (for Lens Groups)
community_threads (for threads in communities)
-- No feed-specific tables
-- No replies table
```

**Verdict**: The feed system has **zero database support**. All tables are community-focused.

---

## Lens Protocol Integration Divergence

### What Old Docs Claimed

- Independent Lens Feeds for each category
- Metadata prefix: `LearningLens: [Tier]`
- Shadow indexer listening to Lens events
- Forum adapter transforming Lens data

### What Actually Exists

- ✅ Lens Protocol client (`lib/external/lens/`)
- ✅ Community adapter (`lib/adapters/community-adapter.ts`)
- ❌ No feed adapter
- ❌ No feed service
- ❌ No feed indexer
- ❌ No metadata prefix in use

**Verdict**: Lens integration exists **only for communities**, not feeds.

---

## Configuration Divergence

### What Old Docs Claimed

- Environment-based feed configuration
- Validation of Lens Feed addresses at startup
- Hot-reload support

### What Actually Exists

- ✅ `config/commons-config.ts` with hardcoded placeholder addresses
- ❌ No environment variable mapping
- ❌ No validation logic
- ❌ No hot-reload

**Verdict**: Configuration is **static and fake** (feed-1, feed-2, etc.).

---

## Route Divergence

### What Old Docs Implied

```
/feed/[categoryId] (for feed pages)
```

### What Actually Exists

```
/communities/[address] (for community pages)
-- No /feed/ routes
-- No /commons/ routes (but links point to /commons/[address])
```

**Verdict**: Feed routes are **completely missing**.

---

## Recommendations for Cleanup

### Immediate Actions

1. **Delete unused home components**:
   ```bash
   rm components/home/featured-communities.tsx
   rm components/home/hero-section.tsx
   rm components/home/stats-bar.tsx
   rm components/home/thread-list-item.tsx
   rm components/home/thread-votes-display.tsx
   rm components/home/threads-list.tsx
   rm components/home/threads-switcher.tsx
   ```

2. **Archive old Context.md**:
   ```bash
   mv MyDataSource/Context.md MyDataSource/Context.old.md
   ```

3. **Keep codebase.md as reference** (useful for AI context).

### Future Actions (After Feed System Implementation)

1. **Audit community components**: Determine if community system is separate or being replaced.

2. **Create feed-specific tables**:
   ```sql
   feeds (feed metadata)
   feed_threads (thread cache)
   feed_replies (reply cache)
   ```

3. **Implement feed services**:
   ```
   lib/services/feed/
   lib/adapters/feed-adapter.ts
   ```

4. **Create feed routes**:
   ```
   app/commons/[address]/page.tsx
   ```

---

## What to Keep from Old Docs

### Preserve These Sections

1. **Engineering Guardrails** (Next.js/React version constraints)
2. **3-Step Authentication Handshake** (accurate)
3. **Tech Stack Overview** (mostly accurate)
4. **Lens Protocol Mapping Table** (aspirational, but useful for future)

### Discard These Sections

1. **Implementation Roadmap** (outdated)
2. **Shadow Indexing Strategy** (not implemented)
3. **Tier 2 and Tier 3 descriptions** (vaporware)
4. **Property-Based Testing** (not implemented)
5. **Parser/Serializer Requirements** (not implemented)

---

## Conclusion

**Old Context.md**: 80% theoretical, 20% reality  
**New context.md**: 100% reality-based  
**codebase.md**: Useful reference, not documentation

**Action Plan**:
1. ✅ Use new `context.md` as source of truth
2. ✅ Archive old `Context.md`
3. ✅ Delete 7 unused home components
4. ⏳ Wait to delete community components until feed system is live
5. ⏳ Implement feed routes and backend integration

---

**Status**: Analysis complete  
**Next Step**: Execute cleanup script
