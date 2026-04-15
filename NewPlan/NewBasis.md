# Society Protocol Forum — Complete Build Reference

> Single-file reference for rebuilding the entire forum from scratch.
> Derived from BLUEPRINT phases 1–11, codebase analysis, and implementation notes.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure & Auth](#2-infrastructure--auth)
3. [Lens Protocol Primitives](#3-lens-protocol-primitives)
4. [Database Schema](#4-database-schema)
5. [Forum Pages (Read Layer)](#5-forum-pages-read-layer)
6. [Composer (Write Layer)](#6-composer-write-layer)
7. [Publish Flow (Onchain)](#7-publish-flow-onchain)
8. [Forum Features](#8-forum-features)
9. [Research Section](#9-research-section)
10. [Recovery & Sync](#10-recovery--sync)
11. [Deployment & Polish](#11-deployment--polish)
12. [Customization](#12-customization)
13. [File Inventory](#13-file-inventory)

---

## 1. Architecture Overview

### The Two-Layer Model

```
PERMANENT LAYER (onchain, indestructible):
  Lens Protocol  →  every post is a standalone article
  Grove Storage  →  full content stored permanently
  Metadata attrs →  forumCategory, forumThreadId, contentJson, tags

SPEED LAYER (Supabase, rebuildable from permanent layer):
  forum_threads        →  thread metadata + content cache
  forum_thread_replies →  reply metadata + content cache
  forum_categories     →  board categories with counts
  forum_votes          →  vote tracking (optional)
```

If Supabase is wiped → run recovery script → reads everything from Lens → forum is back.

### Core Design Rules

1. **Don't break Fountain.** All forum code is additive — new files, new routes, new tables.
2. **Supabase = speed layer, Lens = truth.** Forum tables cache onchain data. Everything is recoverable.
3. **No `commentOn`.** Every post (thread or reply) is a standalone Lens article. Thread structure exists only in Supabase metadata attributes.
4. **Same editor, different wrapper.** Plate.js powers both the publication editor and the forum composer. Same plugins, same formatting.

### Tech Stack

- **Next.js 14** — React framework (App Router)
- **Plate.js** — Rich text editor (Slate-based)
- **Lens Protocol** — Decentralized social protocol (posts, feeds, groups, reactions)
- **Grove** — Decentralized storage for content
- **Supabase** — PostgreSQL database (self-hosted on VPS)
- **Bun** — JavaScript runtime and package manager

### How Posts Flow

```
User writes in composer
  → Plate.js stores as JSON internally
  → On submit: extract JSON + markdown from editor
  → Build Lens article metadata (with forum attributes)
  → Upload metadata to Grove → get contentUri
  → Publish to Lens Feed (standalone article, NO commentOn)
  → Wallet signs the transaction
  → Save to Supabase (thread or reply row with content_json)
  → Post appears on forum immediately (from Supabase)
  → Post also visible on other Lens apps (Hey.xyz, etc.) as "Title — URL"
```

---

## 2. Infrastructure & Auth

### What You Need

- VPS (Ubuntu, 2+ CPU, 8GB+ RAM)
- Domain with SSL
- Wallet that owns a Lens App (Builder wallet)
- Lens App addresses (mainnet + testnet)

### Auth Server

Fountain uses a separate auth server that signs Lens operations. It's a small Node.js service.

```
fountain-ink/auth → your-org/forum-auth
```

**Keys to generate:**

- `SIGNER_PRIVATE_KEY` — signs operations (NOT the Builder wallet key)
- `SIGNER_ADDRESS` — registered with Lens as App Signer
- `AUTH_API_SECRET` — shared secret between Lens API and auth server

**One-time Lens registration (run as Builder wallet):**

1. `addAppAuthorizationEndpoint(sessionClient, { endpoint, app, bearerToken })`
2. `addAppSigners(sessionClient, { app, signers: [SIGNER_ADDRESS] })`

**Auth server must respond < 500ms** or Lens rejects logins.

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...

# Lens
NEXT_PUBLIC_APP_ADDRESS=0x...  (mainnet)
NEXT_PUBLIC_APP_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_ENVIRONMENT=production
LENS_API_KEY=...

# Auth
NEXT_PUBLIC_AUTH_SERVER_URL=https://auth.yourdomain.com

# App
NEXT_PUBLIC_SITE_URL=https://forum.yourdomain.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Placeholders (required by Fountain's env schema)
IFRAMELY_API_KEY=placeholder
LISTMONK_URL=placeholder
LISTMONK_API_KEY=placeholder
```

---

## 3. Lens Protocol Primitives

### What Gets Created Onchain

```
Lens App (your app address)
├── Commons Group    (open membership)
├── Research Group   (open membership)
├── Commons Feed     (GroupGatedFeedRule → Commons Group)
└── Research Feed    (GroupGatedFeedRule → Research Group)
```

**Groups** control who can post. Open membership = anyone can join instantly.
**Feeds** are gated by group membership. You must join the group to post to its feed.

### Constants File

```typescript
// src/lib/forum/constants.ts
export const COMMONS_GROUP_ADDRESS = "0x...";
export const RESEARCH_GROUP_ADDRESS = "0x...";
export const COMMONS_FEED_ADDRESS = "0x...";
export const RESEARCH_FEED_ADDRESS = "0x...";

export type FeedType = "commons" | "research";

export const FEED_MAP: Record<FeedType, { feed: string; group: string }> = {
  commons: { feed: COMMONS_FEED_ADDRESS, group: COMMONS_GROUP_ADDRESS },
  research: { feed: RESEARCH_FEED_ADDRESS, group: RESEARCH_GROUP_ADDRESS },
};
```

### Categories

30 categories across 5 sections:

- **General Discussion** (4, commons feed) — landing page list layout
- **Functions** (11, research feed) — landing page grid layout
- **Others** (5, commons feed) — landing page list layout
- **Partner Communities** (4, commons feed) — landing page list layout
- **Technical** (6, research feed) — Research page only, NOT on landing

Each category has: `slug`, `name`, `description`, `section`, `feed`, `displayOrder`, optional `color`.

---

## 4. Database Schema

### Tables

**`forum_categories`** — Board categories (slug PK, static reference)

```sql
slug TEXT PRIMARY KEY,
name TEXT NOT NULL,
description TEXT,
section TEXT NOT NULL,        -- general, functions, others, partners, technical
feed TEXT NOT NULL,           -- commons or research
display_order INT DEFAULT 0,
thread_count INT DEFAULT 0,
color TEXT                    -- hex color for research categories
```

**`forum_threads`** — Thread metadata + content cache

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
root_publication_id TEXT UNIQUE NOT NULL,  -- Lens publication ID
feed TEXT NOT NULL,                        -- commons or research
category TEXT REFERENCES forum_categories(slug),
title TEXT NOT NULL,
summary TEXT,
content_text TEXT,                         -- for full-text search (GIN index)
content_json JSONB,                        -- Plate.js JSON for fast rendering
content_uri TEXT,                          -- Grove storage URI
author_address TEXT NOT NULL,
author_username TEXT,
reply_count INT DEFAULT 0,
views_count INT DEFAULT 0,
is_pinned BOOLEAN DEFAULT false,
is_locked BOOLEAN DEFAULT false,
is_hidden BOOLEAN DEFAULT false,
tags TEXT[],                               -- for research threads
last_reply_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

**`forum_thread_replies`** — Reply metadata + content cache

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
thread_id UUID REFERENCES forum_threads(id),
publication_id TEXT UNIQUE NOT NULL,       -- Lens publication ID
position INT NOT NULL,                     -- reply #1, #2, etc.
content_text TEXT,
content_json JSONB,
content_uri TEXT,
author_address TEXT NOT NULL,
author_username TEXT,
is_hidden BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT now()
```

**`forum_votes`** — Upvotes/downvotes per publication

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
publication_id TEXT NOT NULL,
voter_address TEXT NOT NULL,
direction INT NOT NULL DEFAULT 1,          -- 1 = up (heart)
created_at TIMESTAMPTZ DEFAULT now(),
UNIQUE(publication_id, voter_address)
```

### Helper Functions

```sql
-- Increment thread count for a category
forum_add_thread_to_category(category_slug TEXT)

-- Full-text search across threads
forum_search_threads(search_query TEXT, result_limit INT)

-- Increment view count
forum_increment_views(pub_id TEXT)
```

### RLS

All tables have Row Level Security enabled. Policies use `auth.jwt() ->> 'sub'` (Fountain's pattern). Admin checks use the existing `is_admin()` function.

---

## 5. Forum Pages (Read Layer)

### Routes

```
/boards                              → Landing page (4 sections + language boards)
/boards/[feed]?category=[slug]       → Thread list for a category
/thread/[rootPublicationId]          → Thread detail (root + stacked replies)
/research                            → Research stream (flat, filterable)
```

### Landing Page (`/boards`)

Server component. Renders 4 sections from `LANDING_SECTIONS`:

- **General Discussion** — list layout (rows with name, description, thread count, activity)
- **Functions** — grid layout (2-col first row, 3-col remaining)
- **Others** — list layout
- **Partner Communities** — list layout
- **Language Boards** — 3 static cards (Español, Português, 中文)

Max width: 960px centered.

### Thread List (`/boards/[feed]?category=[slug]`)

Server component. Table with columns: Topic, Started by, Replies, Views, Activity.
Pinned threads first, then sorted by `last_reply_at DESC`.
"New Thread" button opens the composer.

### Thread Detail (`/thread/[rootPublicationId]`)

Server component. Stacked post cards:

- Root post (thread content rendered by Plate.js in readOnly mode)
- Replies stacked below, each with heart button, reply button, mod actions
- Breadcrumb navigation back to board

Content rendering: `<ForumEditor value={JSON.stringify(contentJson)} readOnly={true} />`

### Data Layer

```
src/lib/forum/get-board-sections.ts    — landing page data
src/lib/forum/get-threads.ts           — thread list with pagination
src/lib/forum/get-thread-detail.ts     — thread + replies + view increment
src/lib/forum/get-research-threads.ts  — research stream with filters
```

---

## 6. Composer (Write Layer)

### Architecture

A Discourse-style bottom panel that slides up from the bottom of the page. Persists across page navigations via layout-level rendering.

```
┌──────────────────────────────────────────────────────────────┐
│ ✏️ New Thread                                    [□] [X]     │
├──────────────────────────────────────────────────────────────┤
│ [Title input]                                                │
│ [Category ▾] [Tags ▾]  ← only on /research                  │
├──────────────────────────────────────────────────────────────┤
│ [Full toolbar: Insert, Turn-into, B/I/U/S, lists, etc.]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Plate.js editor (centered, max-width constrained)          │
│                                                              │
│                                          [Create Topic]      │
└──────────────────────────────────────────────────────────────┘
```

### State Management

```typescript
// src/hooks/forum/use-composer.tsx
interface ComposerState {
  status: 'closed' | 'open';
  mode: 'thread' | 'reply';
  threadRef?: { rootPublicationId: string; feed: FeedType; title: string };
  quotedText?: string;
}

// Actions:
openNewThread(category?)     // opens in thread mode
openReply(threadRef, quote?) // opens in reply mode with optional quote
close()                      // closes panel
```

### ForumEditor Component

`src/components/forum/forum-editor.tsx` — a stripped-down Plate.js wrapper:

- Uses `getEditorPlugins()` (same as publication editor)
- Filters out: title, subtitle, dnd, trailingBlock, leadingBlock plugins
- Has its own toolbar (`ComposerToolbarButtons`) — full-featured, no AI/background color
- Exposes `editorRef` callback for getting `getContentJson()` and `getContentMarkdown()`
- Floating toolbar also active on text selection

### Layout Integration

Composer is rendered at the layout level so it persists across navigations:

```
src/app/boards/layout.tsx   → <ComposerProvider> + <ComposerPanel />
src/app/thread/layout.tsx   → <ComposerProvider> + <ComposerPanel />
src/app/research/layout.tsx → <ComposerProvider> + <ComposerPanel />
```

---

## 7. Publish Flow (Onchain)

### Thread Publishing (`publish-thread.ts`)

```
1. Validate category exists
2. Get logged-in user info (address, username)
3. Ensure user is member of the feed's group (auto-join if not)
4. Build Lens article metadata:
   - title: thread title
   - content: "Title — https://forum.yourdomain.com" (display mode)
   - tags: [category, ...userTags]
   - attributes: [{ key: "forumCategory", value: category.slug }, { key: "contentJson", value: JSON }]
5. Upload metadata to Grove → contentUri
6. Publish to Lens Feed (post, NOT commentOn)
7. Wallet signs the transaction
8. Wait for confirmation, fetch created post ID
9. POST /api/forum/threads → save to Supabase
```

### Reply Publishing (`publish-reply.ts`)

Same pipeline but:

- Attribute: `forumThreadId` (root publication ID) instead of `forumCategory`
- No title
- Same feed as the parent thread
- POST /api/forum/replies → save to Supabase, increment reply_count

### Critical: No `commentOn`

Every post is a standalone Lens article. Thread structure is encoded in metadata attributes only. This makes recovery possible — you can reconstruct the entire forum by reading attributes.

### Lens Display Mode

Content field uses `"Title — URL"` format so other Lens apps show a title + link, not the full article text. Actual content lives in `contentJson` attribute and Grove storage.

---

## 8. Forum Features

### Heart Reactions

- Uses Lens `addReaction` / `undoReaction` with `PostReactionType.Upvote`
- Optimistic UI: heart fills immediately, reverts on error
- No Supabase vote tracking for MVP — Lens reactions are source of truth
- Hook: `src/hooks/forum/use-forum-heart.ts`

### Moderation (Admin Only)

Three actions, all Supabase-only (no Lens calls):

- **Pin/Unpin thread** — toggle `is_pinned`
- **Lock/Unlock thread** — toggle `is_locked` (disables replies)
- **Hide reply** — set `is_hidden = true`

Admin check: reads `isAdmin` from JWT claims (Fountain's existing pattern).
API routes: `PATCH /api/forum/threads/[id]/moderate`, `PATCH /api/forum/replies/[id]/moderate`

### Quote-Reply

Click Reply on a post → composer opens with the post's text as a blockquote:

```json
[
  { "type": "blockquote", "children": [{ "type": "p", "children": [{ "text": "quoted text" }] }] },
  { "type": "p", "children": [{ "text": "" }] }
]
```

---

## 9. Research Section

### Design

A flat stream of all Research Feed threads, filterable by category and tag. NOT nested boards like Commons.

### Categories (6, with colors)

```
architecture    → #3b82f6 (blue)
state-machine   → #a855f7 (purple)
consensus       → #f97316 (orange)
cryptography    → #ef4444 (red)
account-system  → #06b6d4 (cyan)
security        → #eab308 (yellow)
```

### Tags

11 Function names used as cross-reference tags: game-theory, function-ideas, hunting, property, parenting, governance, organizations, curation, farming, portal, communication.

### Filter Toolbar

```
[All Categories ▾]  [All Tags ▾]  Latest     [+ New Topic]
```

URL-driven: `/research?category=consensus&tag=hunting`

### Composer Integration

When composing on `/research`:

- Category dropdown shows 6 Technical categories
- Tag dropdown shows 11 Function names
- Both saved to Supabase and Lens metadata

---

## 10. Recovery & Sync

### Full Recovery Script (`scripts/recover-forum.ts`)

Run when Supabase is empty or corrupted:

```
1. Connect to Lens (public client, no auth)
2. Connect to Supabase (service client)
3. For each feed (commons, research):
   Paginate through ALL posts
4. Classify each post by metadata attributes:
   - Has "forumCategory" → thread root
   - Has "forumThreadId" → reply
   - Neither → skip
5. UPSERT threads into forum_threads
6. UPSERT replies into forum_thread_replies (ordered by timestamp)
7. Recount statistics (reply_count, thread_count)
```

Safe to run multiple times (UPSERT prevents duplicates).

### Incremental Sync (`scripts/sync-forum.ts`)

Run every 5 minutes via cron:

- Fetches recent posts from each feed
- Inserts any missing threads/replies
- Detects deleted posts → marks `is_hidden`
- Catches posts made via other Lens apps

### What Recovery Cannot Restore

- View counts (Supabase-only)
- Pin/lock status (Supabase-only)
- Hidden status (Supabase-only)

Content, thread structure, authors, tags, timestamps — all recoverable from Lens.

---

## 11. Deployment & Polish

### Build & Deploy

```bash
bun run build
rsync -avz --exclude node_modules --exclude .git ./ root@VPS:/opt/forum/
# On VPS:
bun install --production
pm2 start "bun run start" --name forum
```

### Nginx

Proxy to Next.js on port 3001 with SSL via Let's Encrypt.

### Cron

```bash
*/5 * * * * cd /opt/forum && npx tsx scripts/sync-forum.ts >> /var/log/forum-sync.log 2>&1
```

### SEO

- `generateMetadata()` on thread, board, and research pages
- Sitemap includes `/boards`, `/research`, all categories, recent threads
- Health check at `/api/health`

### Lens Display Mode Verification

Posts on other Lens apps show `"Title — URL"` not full content.

---

## 12. Customization

| Item               | What to change                                                |
| ------------------ | ------------------------------------------------------------- |
| Landing page       | `/` renders boards content instead of Fountain marketing      |
| Favicon            | Replace `public/favicon.ico`                                  |
| Footer             | Update org name, social links, contact in `global-footer.tsx` |
| Site title         | Update metadata in `layout.tsx`                               |
| Analytics          | Replace or remove Fountain's analytics script                 |
| Post page sections | Conditionally hide comments/readmore for forum posts          |

---

## 13. File Inventory

### Forum-Specific Files (50 files)

**Data layer** (8 files):

```
src/lib/forum/constants.ts              — feed/group addresses, FeedType
src/lib/forum/categories.ts             — 30 categories, sections, colors
src/lib/forum/types.ts                  — ForumDraft interface
src/lib/forum/get-board-sections.ts     — landing page data
src/lib/forum/get-threads.ts            — thread list with pagination
src/lib/forum/get-thread-detail.ts      — thread + replies
src/lib/forum/get-research-threads.ts   — research stream with filters
src/lib/forum/ensure-group-membership.ts — auto-join group before posting
```

**Publish pipeline** (2 files):

```
src/lib/forum/publish-thread.ts         — thread → Lens + Supabase
src/lib/forum/publish-reply.ts          — reply → Lens + Supabase
```

**Components** (18 files):

```
src/components/forum/composer-panel.tsx          — sliding bottom panel
src/components/forum/composer-header.tsx         — title + category/tags
src/components/forum/composer-toolbar-buttons.tsx — full toolbar (no AI)
src/components/forum/forum-editor.tsx            — Plate.js wrapper
src/components/forum/forum-post-card.tsx         — single post card
src/components/forum/forum-post-content.tsx      — content renderer
src/components/forum/board-section-list.tsx       — section with list rows
src/components/forum/board-section-grid.tsx       — section with grid cards
src/components/forum/board-category-row.tsx       — category row
src/components/forum/board-grid-card.tsx          — grid card
src/components/forum/thread-list-view.tsx         — thread table
src/components/forum/research-filter-toolbar.tsx  — filter dropdowns
src/components/forum/research-thread-row.tsx      — research thread row
src/components/forum/category-badge.tsx           — colored category pill
src/components/forum/tag-pill.tsx                 — gray tag pill
src/components/forum/heart-button.tsx             — heart reaction
src/components/forum/mod-actions.tsx              — pin/lock/hide buttons
src/components/forum/onchain-badge.tsx            — pending/onchain status
src/components/forum/new-thread-button.tsx        — "New Thread" trigger
src/components/forum/reply-button.tsx             — "Reply" trigger
src/components/forum/language-board-cards.tsx      — language board cards
src/components/forum/home-wrapper.tsx             — home page wrapper
src/components/forum/research-join-button.tsx     — join research group
```

**Hooks** (3 files):

```
src/hooks/forum/use-composer.tsx         — composer state + context
src/hooks/forum/use-forum-heart.ts       — heart reaction logic
src/hooks/forum/use-is-moderator.ts      — admin check from JWT
```

**Pages** (6 files):

```
src/app/boards/page.tsx                  — landing page
src/app/boards/layout.tsx                — composer provider wrapper
src/app/boards/[feed]/page.tsx           — thread list
src/app/thread/[rootPublicationId]/page.tsx — thread detail
src/app/thread/layout.tsx                — composer provider wrapper
src/app/research/page.tsx                — research stream
src/app/research/layout.tsx              — composer provider wrapper
```

**API routes** (5 files):

```
src/app/api/forum/threads/route.ts               — create/track threads
src/app/api/forum/replies/route.ts                — create/track replies
src/app/api/forum/threads/[id]/moderate/route.ts  — pin/lock
src/app/api/forum/replies/[id]/moderate/route.ts  — hide
src/app/api/forum/membership/route.ts             — group membership
```

**Scripts** (2 files):

```
scripts/recover-forum.ts     — full recovery from Lens
scripts/sync-forum.ts        — incremental sync (cron)
```

**Database** (2 files):

```
supabase/migrations/20260405_forum_schema.sql     — tables + indexes + RLS
supabase/migrations/20260405_seed_categories.sql  — 30 category rows
```

### Fountain Files Modified (minimal)

```
src/components/navigation/header.tsx  — added Research button + Write button on forum pages
src/middleware.ts                     — added forum domain to allowedOrigins
src/app/page.tsx                      — landing page renders boards content
```

All other Fountain files remain untouched. The forum is entirely additive.
