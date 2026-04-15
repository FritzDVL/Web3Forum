# Architecture Transition Plan: From 26+ Feeds to 2 Groups + 3 Feeds

## Current State Analysis

### The Research Group & Feed Mystery (Solved)

In `constants.ts`:
```
RESEARCH_GROUP_ADDRESS = "0x7303D4F3e6499C24A1A2902261B848F7bBC6B914"  // UNUSED
RESEARCH_FEED_ADDRESS  = "0xDfe0F7fdf80Df515D396470e6bB1d8f398ddF25F"  // ACTIVE
```

- `RESEARCH_GROUP_ADDRESS` — a Lens Group that exists onchain but is **never imported or referenced** anywhere in the codebase. It was created but never wired in.
- `RESEARCH_FEED_ADDRESS` — actively used by `create-research-thread.ts` and `create-research-response.ts`. All research posts go here.

They are **separate onchain contracts**. The Group and the Feed are not linked — the Feed has no `GroupGatedFeedRule` pointing to the Group. They were probably created together with the intention of gating the feed to the group, but the gating was never configured.

The Research section has its own parallel data pipeline:
- Supabase tables: `research_publications`, `research_categories`
- Services: `lib/services/research/`
- UI: `app/research/`, `components/research/`

This is completely separate from the Boards pipeline (which uses `feeds` + `feed_posts` tables).

### The Placeholder Addresses

These exist only in Supabase and `commons-config.ts`:
- `feed-20` through `feed-23` — Technical section (7 feeds with variants like `feed-21a`, `feed-23a`, `feed-23b`)
- `feed-26` — Economics

They were **never deployed as Lens Feed contracts**. They're string placeholders in the database. The UI marks them `isLocked: true` so users see them but can't interact. They have no onchain presence.

Safe to delete from Supabase. No data loss.

### What's Actually Working

| System | Feeds | Onchain? | Gated? | Data Pipeline |
|---|---|---|---|---|
| Boards (General, Functions, Others) | ~19 real Lens feeds | Yes | No rules | `feeds` + `feed_posts` tables |
| Boards (Partners) | 4 real Lens feeds | Yes | No rules | `feeds` + `feed_posts` tables |
| Boards (Technical) | 7 placeholder feeds | No | N/A (locked in UI) | `feeds` table only |
| Research | 1 real Lens feed | Yes | No rules | `research_publications` + `research_categories` |
| Communities (LOCAL) | 1 feed per community | Yes | GroupGatedFeedRule | `communities` + `community_threads` |
| Base Feed | 1 feed (0x3BF4...) | Yes | No rules | Referenced in constants only |

Total: ~26 real onchain feeds + 8 placeholders = 34 entries, 2 data pipelines, 0 access control on the boards/research feeds.

---

## Target Architecture

### 2 Main Groups + N Community Groups

```
LENS APP (0x637E...)
│
├── Authorization Endpoint (controls login)
├── App Verification (anti-spam signing)
│
├── GROUP 1: "Society Protocol Commons"
│   Rule: MembershipApprovalGroupRule
│   Purpose: General discussion, governance, partners, off-topic
│   │
│   └── FEED 1: "Commons Feed"
│       Rule: GroupGatedFeedRule → Group 1
│       Categories (UI-level, stored in Supabase):
│         - Beginners & Help
│         - Key Concepts
│         - Web3 Outpost
│         - DAO Governance
│         - Partner Communities
│         - Network States
│         - Meta-discussion
│         - Politics & Society
│         - Crypto & Web3
│         - Off-topic
│
├── GROUP 2: "Society Protocol Research"
│   Rule: MembershipApprovalGroupRule (or TokenGatedGroupRule)
│   Purpose: Technical research, architecture, game theory
│   │
│   └── FEED 2: "Research Feed"
│       Rule: GroupGatedFeedRule → Group 2
│       Categories (UI-level):
│         - General Architecture
│         - State Machine
│         - Consensus (Proof of Hunt)
│         - Cryptography
│         - Account System
│         - Security
│         - Economic Game Theory
│         - Function Ideas
│         - All 11 "Functions" topics
│
├── COMMUNITY GROUPS (keep existing pattern)
│   Each community = 1 Group + 1 group-gated Feed
│   Created by users, one per language or topic
│   Managed independently
│
└── FEED 3: "Announcements" (optional)
    Rule: Custom rule — only admins can post
    Purpose: Official announcements, read-only for members
```

### Why 2 Groups Instead of 1

- Different membership criteria: Commons could be open (or easy approval), Research could require demonstrated expertise or token holding
- Different moderation needs: Research needs stricter quality control
- Different UI layouts: Commons = traditional forum boards, Research = Discourse-style threaded discussions
- Separate admin teams possible in the future

### Why 3 Feeds (or 2) Instead of 26

- Categories are a UI concern, not an onchain concern
- 1 feed per access tier, not 1 feed per topic
- Simpler to manage, fewer contracts, fewer things to break
- The 3rd feed (Announcements) is optional — could start with just 2

---

## Step-by-Step Transition Plan

### Phase 0: Cleanup (No Breaking Changes)

**Goal:** Remove dead code and placeholders.

1. Delete placeholder feeds from Supabase:
   ```sql
   DELETE FROM feeds WHERE lens_feed_address LIKE 'feed-%';
   ```

2. Remove `RESEARCH_GROUP_ADDRESS` from `constants.ts` (it's unused)

3. Delete obsolete migration files or mark them as historical:
   - `20260301_add_missing_technical_feeds.sql`
   - `20260302_fix_technical_feeds.sql`
   - `20260302_remove_duplicate_feed.sql`
   - `supabase/add-missing-feeds.sql`

### Phase 1: Authorization Endpoint

**Goal:** Control who can log in to the app.

1. Create `app/api/lens-auth/route.ts`
2. Add env vars: `LENS_AUTH_SECRET`, `LENS_APP_SIGNING_KEY`, `LENS_APP_SIGNER_ADDRESS`
3. Create `scripts/setup-app-auth.ts` (registers endpoint + signer with Lens)
4. Run script once against mainnet

Start with `allowed: true` for all accounts. Tighten later.

### Phase 2: Create New Groups + Feeds

**Goal:** Deploy the 2 main groups and their gated feeds.

1. Create `scripts/setup-community-structure.ts`:
   - Create Group 1 (Commons) with MembershipApprovalGroupRule
   - Create Group 2 (Research) with MembershipApprovalGroupRule
   - Create Feed 1 (Commons) with GroupGatedFeedRule → Group 1
   - Create Feed 2 (Research) with GroupGatedFeedRule → Group 2
   - Optionally create Feed 3 (Announcements)
   - Register all feeds with the app via `addAppFeeds`

2. Save new addresses to `constants.ts`:
   ```ts
   export const COMMONS_GROUP_ADDRESS: Address = "0x...";
   export const RESEARCH_GROUP_ADDRESS_V2: Address = "0x...";
   export const COMMONS_FEED_ADDRESS: Address = "0x...";
   export const RESEARCH_FEED_ADDRESS_V2: Address = "0x...";
   ```

### Phase 3: Database Schema Update

**Goal:** Unify the two data pipelines.

1. Add `category` column to `feed_posts` table:
   ```sql
   ALTER TABLE feed_posts ADD COLUMN category TEXT;
   ```

2. Add new feed rows to `feeds` table for the 2 (or 3) new feeds

3. Optionally merge `research_publications` into `feed_posts`:
   - Map research categories to the new category system
   - Or keep research tables as-is and just point new research posts to the new feed

### Phase 4: Update Services

**Goal:** Point new posts to the new feeds.

1. Update `create-board-post.ts`:
   - Accept a `category` parameter
   - Post to Commons Feed (or Research Feed based on section)
   - Store category in Supabase

2. Update `create-research-thread.ts` and `create-research-response.ts`:
   - Point to `RESEARCH_FEED_ADDRESS_V2` instead of old address

3. Update `get-board-posts.ts`:
   - Fetch from new feed address
   - Filter by category in Supabase

4. Update `get-boards.ts`:
   - Build sections from category config, not individual feed addresses

5. Update `commons-config.ts`:
   - Replace 26+ feed entries with 2-3 feeds + category lists

### Phase 5: Update UI

**Goal:** Categories become a dropdown/filter, not separate pages.

1. Board list page: show categories grouped by section
2. Board detail page: filter posts by category
3. Post creation form: add category selector
4. Research section: keep Discourse layout, just point to new feed

### Phase 6: Tighten Access

**Goal:** Make it actually private.

1. Update Authorization Endpoint to check group membership
2. Approve initial members in both groups
3. Optionally add TokenGatedGroupRule as additional layer
4. Enable App Verification

---

## What Happens to Old Data

- Old posts on old feeds remain onchain forever
- Old Supabase data stays in `feed_posts` table
- The UI can show old posts by querying Supabase (which still has the old feed_id references)
- New posts go to new feeds
- Over time, old feeds become historical archives

No data migration needed. Just a cutover point where new posts go to new feeds.

---

## Constants.ts After Migration

```ts
// App
export const APP_ADDRESS: Address = "0x637E685eF29403831dE51A58Bc8230b88549745E";

// Main Groups
export const COMMONS_GROUP_ADDRESS: Address = "0x...new...";
export const RESEARCH_GROUP_ADDRESS: Address = "0x...new...";

// Main Feeds (group-gated)
export const COMMONS_FEED_ADDRESS: Address = "0x...new...";
export const RESEARCH_FEED_ADDRESS: Address = "0x...new...";

// Legacy (keep for reading old posts)
export const LEGACY_BASE_FEED_ADDRESS: Address = "0x3BF4Eb9725232130F5dA804cD16bBdb61171cf28";
export const LEGACY_RESEARCH_FEED_ADDRESS: Address = "0xDfe0F7fdf80Df515D396470e6bB1d8f398ddF25F";

// Admin
export const ADMIN_USER_ADDRESS: Address = "0xc93947ed78d87bdeb232d9c29c07fd0e8cf0a43e";
```
