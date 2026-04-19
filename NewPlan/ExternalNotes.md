# Implementation Plan: Supabase-First Publishing for Fountain.ink

> Adapting the Web3Forum "save first, publish second" pattern to Fountain.ink's existing architecture.

---

## Goal

Make posts visible instantly by saving content to Supabase before attempting the Lens on-chain transaction. If Lens fails, the post still exists. All page reads come from Supabase — Lens becomes the permanent/verification layer, not the read layer.

---

## Current State (Fountain.ink)

| Aspect | How it works today |
|--------|--------------------|
| **posts table** | Minimal slug-mapping only: `id`, `created_at`, `lens_slug`, `slug`, `author`, `handle`. No content. |
| **Publish flow** | Draft → build metadata → upload to Grove → on-chain `post()` → wait for tx → create post record → delete draft → redirect. Entire flow blocks on wallet signature + chain confirmation. |
| **Read path** | All post content fetched from Lens via `fetchPost()`. Supabase only resolves slugs to Lens post IDs. |
| **Failure mode** | If Lens publish fails, nothing is saved. The draft remains, user sees a toast error. |
| **Draft lifecycle** | Draft is deleted immediately after successful publish. No intermediate "published but pending on-chain" state. |

## Target State (Web3Forum pattern adapted)

| Aspect | How it will work |
|--------|-----------------|
| **posts table** | Extended with `content_json`, `content_markdown`, `content_html`, `title`, `subtitle`, `cover_url`, `tags`, `publish_status`, `content_uri`, `lens_post_id`, `updated_at`. Becomes the content store. |
| **Publish flow** | Draft → save full post to Supabase (`publish_status: 'pending'`) → delete draft → redirect to post page (visible immediately) → attempt Lens publish → update `publish_status` to `confirmed` or `failed`. |
| **Read path** | All post content read from Supabase `posts` table. Lens is never called for page rendering. |
| **Failure mode** | Post is visible from Supabase regardless of Lens outcome. A status badge shows on-chain state. User can retry failed publishes. |
| **Draft lifecycle** | Draft is deleted when the post is saved to Supabase (before Lens), not after Lens confirms. |

---

## Phase 1: Extend the Posts Table

### 1.1 New Migration

Create `supabase/migrations/YYYYMMDD_extend_posts_for_content.sql`:

```sql
-- Add content and status columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS content_markdown text,
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS content_uri text,
  ADD COLUMN IF NOT EXISTS lens_post_id text,
  ADD COLUMN IF NOT EXISTS blog_address text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for status-based queries (e.g. "show me my failed posts")
CREATE INDEX IF NOT EXISTS idx_posts_publish_status ON public.posts (publish_status);

-- Index for blog listing pages
CREATE INDEX IF NOT EXISTS idx_posts_blog_address ON public.posts (blog_address);

-- Index for author listing pages
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author);

-- Composite index for the most common read: "posts by author, newest first"
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts (author, created_at DESC);

-- Add a CHECK constraint for valid statuses
ALTER TABLE public.posts
  ADD CONSTRAINT posts_publish_status_check
  CHECK (publish_status IN ('draft', 'pending', 'confirmed', 'failed'));
```

**`publish_status` values:**
| Status | Meaning |
|--------|---------|
| `draft` | Reserved for future use (saved but not yet submitted for publishing) |
| `pending` | Saved to Supabase, Lens publish in progress or not yet attempted |
| `confirmed` | Lens transaction confirmed, `lens_post_id` and `content_uri` populated |
| `failed` | Lens publish was attempted and failed; post is still readable from Supabase |

### 1.2 Regenerate Database Types

Run `bun run db:generate-types` (or the equivalent script in `src/lib/scripts/db-generate-types.ts`) to update `src/lib/db/database.ts` with the new columns.

### 1.3 Update RLS Policies

Add policies for the new columns. The existing RLS on `posts` likely allows authors to read/write their own rows. Verify that:
- Authors can INSERT and UPDATE their own posts (where `author = auth.uid()` or the app-token pattern used by Fountain).
- Public users can SELECT posts where `publish_status IN ('pending', 'confirmed')` — not `draft` or `failed` (unless the author is viewing their own).
- Service role client bypasses RLS for admin/system operations.

---

## Phase 2: Split the Publish Flow

This is the core change. The current `publishPost()` function does everything in one blocking sequence. We split it into two phases.

### 2.1 New Function: `savePostToSupabase()`

**File:** `src/lib/publish/save-post.ts` (new file)

**Purpose:** Save the post content to the `posts` table with `publish_status: 'pending'`. This replaces the "create post record" step and happens BEFORE any Lens interaction.

**Inputs:** The `Draft` object + user info (username, address).

**Operations:**
1. Generate the post `id` (use `crypto.randomUUID()` or the existing `getRandomUid()` pattern).
2. Extract `title`, `subtitle`, `coverUrl`, `tags` from the draft.
3. Get `contentMarkdown` from the draft (already available from autosave).
4. Get `contentJson` from the draft.
5. Get `contentHtml` from the draft (already available from autosave).
6. Resolve `blog_address` from `draft.distributionSettings.selectedBlogAddress`.
7. INSERT into `posts` table with all content columns + `publish_status: 'pending'`.
8. Return the new post `id` and `slug`.

**Key detail:** This function calls the server (either via API route or a new server action). It does NOT touch Lens, Grove, or the wallet. It should be fast (~200ms).

### 2.2 New Function: `publishPostToLens()`

**File:** `src/lib/publish/publish-post-to-lens.ts` (new file)

**Purpose:** Take an already-saved post and publish it on-chain. Updates the Supabase row with `lens_post_id`, `content_uri`, and `publish_status`.

**Inputs:** The post `id` (Supabase), the `Draft` object (for metadata construction), wallet client, and user info.

**Operations:**
1. Build Lens article metadata (same as current `publishPost` steps 5–10).
2. Upload to Grove → get `contentUri`.
3. Resolve feed address from blog.
4. Build collect actions.
5. Call `post()` on Lens, sign with wallet, wait for transaction.
6. On success: UPDATE the Supabase `posts` row with `lens_post_id`, `content_uri`, `publish_status: 'confirmed'`.
7. On failure: UPDATE the Supabase `posts` row with `publish_status: 'failed'`.
8. Return success/failure.

### 2.3 Refactor `publishPost()` to Orchestrate Both

**File:** `src/lib/publish/publish-post.ts` (modify existing)

The new flow:

```
1. Validate user session (same as today)
2. savePostToSupabase(draft, user)          ← NEW: post is now visible
3. deleteCloudDraft(documentId, queryClient) ← MOVED: draft deleted early
4. router.push(`/p/${username}/${slug}`)     ← MOVED: redirect immediately
5. publishPostToLens(postId, draft, wallet)  ← Lens publish (can fail gracefully)
6. If sendNewsletter, createNewsletterCampaign() (only if Lens confirmed)
```

The user sees their post page immediately after step 4. The Lens publish happens in the background (step 5). The page shows a `PublishStatusBadge` that updates when Lens confirms or fails.

### 2.4 Handle the Edit Flow

**File:** `src/lib/publish/publish-post-edit.ts` (modify existing)

Same split:
1. UPDATE the Supabase `posts` row with new content, set `publish_status: 'pending'`.
2. Redirect to the post page.
3. Call `editPost()` on Lens in the background.
4. Update `publish_status` to `confirmed` or `failed`.

### 2.5 New API Route: `POST /api/posts/save`

**File:** `src/app/api/posts/save/route.ts` (new file)

Accepts the full post payload (title, content_json, content_markdown, content_html, subtitle, cover_url, tags, slug, blog_address, handle) and inserts into the `posts` table with `publish_status: 'pending'`. Returns the post `id`.

Alternatively, extend the existing `POST /api/posts` route to accept content fields. The current route only accepts `lens_slug`, `slug`, `handle`, `post_id` — it would need to accept the full content payload.

**Recommendation:** Extend the existing route rather than creating a new one. Add a `content` field to the POST body that, when present, triggers the full-content insert path.

### 2.6 New API Route: `PATCH /api/posts/status`

**File:** `src/app/api/posts/status/route.ts` (new file)

Accepts `{ post_id, publish_status, lens_post_id?, content_uri? }` and updates the corresponding row. Called after Lens publish succeeds or fails.

---

## Phase 3: Supabase-First Read Path

### 3.1 New Server Function: `getPostFromSupabase()`

**File:** `src/lib/post/get-post.ts` (new file)

**Purpose:** Fetch a post by slug + handle from the `posts` table. Returns all content columns. This replaces the current `fetchPost(lens, { post: postId })` call on post pages.

**Query:**
```sql
SELECT * FROM posts
WHERE slug = $1 AND handle = $2 AND publish_status IN ('pending', 'confirmed')
LIMIT 1
```

Falls back to `lens_slug` if `slug` doesn't match (preserving current behavior from `get-post-by-slug.ts`).

### 3.2 Update Post Page (`/p/[user]/[post]/page.tsx`)

**Current flow:**
1. `getPostIdBySlug(slug, handle)` → Supabase lookup → returns `lens_slug`
2. `fetchPost(lens, { post: lens_slug })` → Lens API → returns full post
3. Extract metadata from `post.metadata.attributes`
4. Render with `<Editor value={contentJson} readOnly />`

**New flow:**
1. `getPostFromSupabase(slug, handle)` → Supabase → returns full post with content
2. Render with `<Editor value={post.content_json} readOnly />`
3. No Lens call needed for content rendering

**Fallback:** If the post is not found in Supabase (e.g., old posts published before this migration), fall back to the current Lens-based fetch. This ensures backward compatibility.

### 3.3 Update Blog Page (`/b/[blog]/page.tsx`)

**Current flow:** Calls `fetchPosts(lens, { filter })` to list blog articles.

**New flow:** Query `posts` table filtered by `blog_address` and `publish_status IN ('pending', 'confirmed')`, ordered by `created_at DESC`. For metadata that still needs Lens (reactions, collect counts), those can be fetched client-side as progressive enhancement.

**Fallback:** Same backward-compatibility approach — if no Supabase posts exist for a blog, fall back to Lens.

### 3.4 Update Post Layout (`/p/[user]/[post]/layout.tsx`)

The layout currently fetches from Lens for SEO metadata (title, description, OG image). Switch to reading from the Supabase `posts` row instead. The `title`, `subtitle`, `cover_url` columns provide everything needed for `<meta>` tags.

### 3.5 Update Feed Components

Components like `PostView`, `post-article-feed.tsx`, and feed pages currently receive Lens `Post` objects. Create an adapter type or update these components to accept either a Lens `Post` or a Supabase post row. The simplest approach:

- Define a `PostData` interface that both sources can map to.
- Create `lensPostToPostData()` and `supabasePostToPostData()` mappers.
- Update components to consume `PostData`.

This keeps the migration incremental — components that still receive Lens data continue to work.

---

## Phase 4: Publish Status Badge

### 4.1 New Component: `PublishStatusBadge`

**File:** `src/components/post/publish-status-badge.tsx` (new file)

Mirrors Web3Forum's badge. Shows:
- ✓ **On-chain** (green) — `publish_status === 'confirmed'`
- ⏳ **Publishing** (amber) — `publish_status === 'pending'`
- ⚠️ **Off-chain** (red) — `publish_status === 'failed'`, with a "Retry" button

### 4.2 Retry Mechanism

**File:** `src/lib/publish/retry-publish.ts` (new file)

When the user clicks "Retry" on a failed post:
1. Read the post content from Supabase (it's all there).
2. Reconstruct the `Draft`-like object from the post row.
3. Call `publishPostToLens()` with the existing post ID.
4. Update `publish_status` accordingly.

This requires the post page to know the `publish_status` and show the badge + retry button only to the post author.

### 4.3 Real-Time Status Updates (Optional Enhancement)

Use Supabase Realtime to subscribe to changes on the post's `publish_status` column. When the Lens publish completes (in a background tab or after redirect), the badge updates live without a page refresh.

**Implementation:** Subscribe to `posts` table changes filtered by `id = postId` in the post page component. On `UPDATE` event where `publish_status` changes, update the local state.

---

## Phase 5: Backfill Existing Posts

Posts published before this migration exist only on Lens with minimal Supabase records (slug mapping). Two strategies:

### 5.1 Lazy Backfill (Recommended)

When a post page loads and `getPostFromSupabase()` returns a row without `content_json` (old record), fall back to Lens fetch. After rendering, fire a background request to backfill the Supabase row with the content from Lens.

**File:** `src/lib/post/backfill-post.ts` (new file)

```
1. Fetch post from Lens by lens_slug
2. Extract contentJson, contentMarkdown, title, subtitle, coverUrl from metadata.attributes
3. UPDATE the posts row with the extracted content + publish_status: 'confirmed'
```

This is transparent to the user — old posts gradually migrate to Supabase as they're viewed.

### 5.2 Bulk Backfill Script (Optional)

**File:** `src/lib/scripts/backfill-posts.ts` (new file)

Iterate all rows in `posts` where `content_json IS NULL`, fetch from Lens, and backfill. Run once as a migration script.

---

## Phase 6: Metadata Attributes for Recovery

Following Web3Forum's pattern, add structured attributes to the Lens metadata so posts can be recovered from on-chain data alone.

### 6.1 Extend `getPostAttributes()`

**File:** `src/lib/publish/get-post-attributes.ts` (modify existing)

Add these attributes to every published post:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `app` | `"fountain"` | Filter — only recover posts from Fountain |
| `postType` | `"article"` | Classify content type (future-proofing for threads, comments, etc.) |
| `blogAddress` | Lens Group address | Which blog the post belongs to |
| `supabasePostId` | The Supabase `posts.id` | Cross-reference back to Supabase |

These are in addition to the existing attributes (`contentJson`, `subtitle`, `coverUrl`, `slug`, etc.) which already provide enough data for content recovery.

---

## File Change Summary

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_extend_posts_for_content.sql` | Schema migration |
| `src/lib/publish/save-post.ts` | Save post to Supabase (Phase 2 core) |
| `src/lib/publish/publish-post-to-lens.ts` | Lens-only publish step |
| `src/lib/publish/retry-publish.ts` | Retry failed Lens publishes |
| `src/app/api/posts/status/route.ts` | Update publish status API |
| `src/lib/post/get-post.ts` | Supabase-first post fetch |
| `src/lib/post/backfill-post.ts` | Lazy backfill from Lens |
| `src/components/post/publish-status-badge.tsx` | On-chain status indicator |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/db/database.ts` | Regenerated types (new columns on posts) |
| `src/lib/publish/publish-post.ts` | Split into save → redirect → Lens publish |
| `src/lib/publish/publish-post-edit.ts` | Same split for edits |
| `src/lib/publish/get-post-attributes.ts` | Add recovery attributes |
| `src/app/api/posts/route.ts` | Accept full content payload on POST |
| `src/app/p/[user]/[post]/page.tsx` | Read from Supabase instead of Lens |
| `src/app/p/[user]/[post]/layout.tsx` | SEO metadata from Supabase |
| `src/app/b/[blog]/page.tsx` | Blog post listing from Supabase |
| `src/components/post/post-view.tsx` | Accept Supabase post data |
| `src/components/draft/draft.ts` | No change needed (Draft type stays as-is) |

### Unchanged
| Area | Why |
|------|-----|
| Draft system | Drafts continue to work exactly as today. The only change is WHEN the draft is deleted (after Supabase save, not after Lens confirm). |
| Publish dialog UI | All three tabs (details, monetization, distribution) remain identical. The form still produces the same Draft object. |
| Editor | No changes to Plate.js editor, autosave, or collaborative editing. |
| Newsletter | Still triggered after Lens confirm (not after Supabase save), so subscribers only get notified for on-chain posts. |
| Lens client setup | `src/lib/lens/` files unchanged. |
| Grove storage | Same upload pattern, just called from `publishPostToLens()` instead of `publishPost()`. |

---

## Implementation Order

| Step | Phase | Estimated Effort | Dependencies |
|------|-------|-----------------|--------------|
| 1 | 1.1–1.3 | Schema migration + types + RLS | None |
| 2 | 2.5–2.6 | New API routes (save, status) | Step 1 |
| 3 | 2.1–2.2 | `savePostToSupabase()` + `publishPostToLens()` | Step 2 |
| 4 | 2.3–2.4 | Refactor `publishPost()` and `publishPostEdit()` | Step 3 |
| 5 | 3.1 | `getPostFromSupabase()` | Step 1 |
| 6 | 3.2–3.4 | Update post page, blog page, layout | Step 5 |
| 7 | 4.1–4.2 | PublishStatusBadge + retry | Steps 4, 6 |
| 8 | 3.5 | Feed component adapter (`PostData` type) | Step 6 |
| 9 | 5.1 | Lazy backfill | Steps 5, 6 |
| 10 | 6.1 | Recovery attributes | Step 4 |
| 11 | 4.3 | Real-time status updates (optional) | Step 7 |
| 12 | 5.2 | Bulk backfill script (optional) | Step 9 |

Steps 1–4 deliver the core "save first" behavior. Steps 5–7 complete the read-path switch. Steps 8–12 are polish and backward compatibility.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Slug uniqueness changes** | Current `posts_slug_key` is globally unique. Web3Forum scopes slugs per handle. | The existing `check-slug-availability.ts` already checks per-handle. Drop the global unique constraint, add a composite unique on `(slug, handle)`. |
| **Stale Supabase content** | If a post is edited on-chain via another Lens client, Supabase won't know. | Accept this trade-off. Fountain.ink is the primary editor. Add a "sync from Lens" admin action for edge cases. |
| **Old posts without Supabase content** | Posts published before migration have no `content_json` in Supabase. | Lazy backfill (Phase 5.1) handles this transparently. Lens fetch is the fallback. |
| **Wallet popup timing** | Users currently expect the wallet popup during publish. Moving it after redirect may confuse them. | Show a clear "Publishing to blockchain..." indicator on the post page. The wallet popup still appears — it just happens while viewing the post instead of while staring at the dialog. |
| **Newsletter sent for failed Lens posts** | If newsletter fires before Lens confirms, subscribers get a link to an off-chain post. | Keep newsletter trigger AFTER Lens confirmation (current behavior). Only change is that the trigger happens from the post page context, not the publish dialog. |
| **RLS complexity** | New content columns need careful RLS. Public reads must not expose `draft` or `failed` posts to non-authors. | Test RLS policies explicitly. Use service client for status updates from background Lens publish. |
