# Publishing Flow Plan: Click-by-Click Transformation

> How the publish experience changes from "block on Lens" to "save first, publish second."

---

## Current Fountain.ink Flow (What Happens Today)

### Click 1: User clicks "Publish" in the editor header

- The editor page (`/w/[documentId]`) has a sticky header with the Publish button top-right.
- Next to it: an options dropdown (preview toggle) and user menu.
- Bottom-right corner: a cloud icon shows autosave status (idle/saving/success/error).
- The Publish button is hidden entirely if the user isn't authenticated.
- If the form defaults are still loading, the button is disabled.

**Result:** A 700×800px dialog opens with the title "Publish post" (or "Update post" for edits).

---

### Click 2–N: User configures the publish dialog

The dialog has 3 tabs. Each tab trigger shows an icon + label. If a tab has validation errors, the icon swaps to a red `AlertCircle` and the label turns red.

**Tab 1: Article Details** (default)
- Preview card showing title, subtitle, cover image with edit toggle (pen icon).
- Cover image carousel: left/right arrows cycle through images found in the content + an upload slot. Counter badge shows `2/5` style.
- Collapsible "Misc" section (chevron rotates 180° on toggle, content animates height 0→auto):
  - Slug input — auto-generated from title. Shows a spinning loader while checking availability. Red `AlertCircle` + red border if taken.
  - Tags input — up to 5 tags. Red ring if validation fails.
  - "Was published before" checkbox → reveals date picker + canonical URL input.

**Tab 2: Monetization**
- Master toggle: "Collecting" (on/off). When off, shows a shopping bag illustration.
- When on, nested toggles appear:
  - Charge for collecting → price input, referral slider, revenue split with recipient list.
  - Limited edition → max collects input.
  - Collect expiry → days input.
  - License selector (30+ options with descriptions).
- Tipping toggle: always on, always disabled (informational).
- Add recipient form slides in from top with animation. User search dropdown appears below the input.

**Tab 3: Distribution**
- Blog selector dropdown.
- Newsletter checkbox — auto-disabled if the selected blog has no mailing list. Description changes between "Subscribers will receive this post" and "This blog doesn't have a newsletter."
- Lens display format selector with live preview:
  - "Title and link" → shows title + URL + OG card mockup.
  - "Content and link" → shows "Posted on Fountain" + content skeleton + OG card.
  - "Content only" → shows title + content skeleton, no link.

All changes auto-sync back to the draft via a `watch` subscription (every keystroke persists to localStorage).

---

### Click N+1: User clicks "Publish" / "Update Post" (submit button)

**If form is invalid:** Red error text appears below the button: "Please fix the errors before publishing." Tab indicators show which tabs have problems.

**If wallet not connected:** `reconnectWallet()` fires, toast says "Please connect your wallet." Dialog stays open.

**If valid:**

```
Button text changes:  "Publish" → "Publishing..."  (disabled)
                      "Update Post" → "Updating..."  (disabled)

Toast appears:        "Publishing post..." (loading spinner)
                      "Updating post..." (loading spinner)
```

Then the following happens **sequentially, all blocking the UI:**

1. Build article metadata from draft content.
2. Upload metadata JSON to Grove storage (~1-3s).
3. Resolve blog → Lens Group → Feed address.
4. Build collect actions from monetization settings.
5. **Call `post()` on Lens → wallet popup appears.** User must sign in MetaMask/etc.
6. Wait for transaction to be indexed on-chain (~5-15s).
7. Fetch the published post by transaction hash to get the slug.
8. Dismiss loading toast → show `toast.success("Post published successfully!")`.
9. Delete the cloud draft from Supabase.
10. Create a post record (slug mapping only: `lens_slug`, `slug`, `handle`).
11. Close the dialog.
12. `router.push(/p/{username}/{slug}?success=true)`.
13. If newsletter enabled, fire campaign creation (async, after redirect).

**If any step fails:** Loading toast dismissed, specific `toast.error(...)` shown, dialog stays open, button re-enables. The user can try again.

**Total blocking time:** ~10-30 seconds (Grove upload + wallet popup + chain confirmation + indexing).

---

### Click N+2: User lands on the published post page

- Page transition animation (framer-motion `AnimatePresence`).
- A **success dialog** appears:
  - Title: "Post Published!" / "Post Updated!"
  - Description: "Congratulations! Your post has been successfully published..."
  - 4 share actions: Share to Bluesky, Share to X, Copy Link, View Post.
- Behind the dialog, the full article renders:
  - Author avatar + date.
  - Title + content via Plate.js editor (read-only).
  - Static action bar: Like, Collect/Tip, Bookmark, Share.
  - Floating action bar appears on scroll (pill-shaped, bottom of viewport, spring animation).
  - Post metadata card with Copyright/License tab and Storage tab (shows Grove/IPFS/Arweave URI).
- Post menu (⋯): Copy link, Edit post (creates new draft from published content), Delete post (hold-to-confirm, 2 seconds).

---

### What's Wrong With This Flow

| Problem | Impact |
|---------|--------|
| **30-second blocking dialog** | User stares at "Publishing..." with no content visible. If they close the tab, everything is lost. |
| **Wallet rejection = nothing saved** | If the user clicks "Reject" in MetaMask, the post doesn't exist anywhere except as a draft. |
| **Lens failure = nothing saved** | Network issues, indexing failures, or chain congestion mean the user has to retry from scratch. |
| **No intermediate state** | There's no "saved but not yet on-chain" concept. It's all-or-nothing. |
| **Draft deleted on success** | The draft is destroyed after Lens confirms. If the post record creation fails silently, the content mapping is lost. |

---

## Web3Forum Flow (The Pattern to Import)

### Click 1: User navigates to `/boards/[slug]/new-post`

- A form page with: Title input, Summary input, ProseKit editor (content), Tags input.
- No multi-tab dialog. No monetization. No distribution settings. Just content.

---

### Click 2: User clicks "Create Post"

Two functions fire in sequence:

**Phase A: `saveForumThread()` — ~200ms**
```
1. Generate slug from title
2. INSERT into forum_threads:
   - board_slug, title, content_markdown, tags
   - author_address, author_username
   - publish_status = "pending"
   - lens_post_id = null
   - content_uri = null
3. Increment forum_boards.thread_count
```
**The post now exists in Supabase. It's visible. It's safe.**

**Phase B: `publishForumThreadToLens()` — ~10-20s**
```
1. Build Lens article metadata with attributes:
   - app: "lensforum"
   - forumType: "thread"
   - forumCategory: board slug
   - contentJson, author, subtitle
2. Upload to Grove → get content URI
3. Publish to COMMONS_FEED_ADDRESS
4. WALLET POPUP → user signs
5. On success: UPDATE forum_threads SET
     lens_post_id = ..., content_uri = ..., publish_status = "confirmed"
6. On failure: UPDATE forum_threads SET
     publish_status = "failed"
```

**Phase C: Redirect**
```
window.location.href → /boards/[slug]  (hard redirect)
```

Post appears in the board list immediately because the board page reads from Supabase.

---

### What the user sees after redirect

- The board page lists threads in a grid: Topic | Started by | Replies | Views | Activity.
- Their new post is in the list.
- Each post has a `PublishStatusBadge`:
  - ✓ **On-chain** (green) — `publish_status === "confirmed"`
  - ⏳ **Publishing** (amber) — `publish_status === "pending"`
  - ⚠️ **Off-chain** (red) — `publish_status === "failed"`

Thread detail page (`/boards/[slug]/post/[postId]`):
- Stacked article cards: root post card + reply cards below.
- Each card has its own `PublishStatusBadge`.
- All content rendered from `content_markdown` in Supabase. Zero Lens calls.

---

## The Adapted Flow for Fountain.ink

### What stays the same

- The 3-tab publish dialog (details, monetization, distribution) — it's good UI, keep it.
- The form validation with Zod + react-hook-form.
- The auto-sync of form values to draft storage.
- The metadata construction (article builder, attributes, Grove upload).
- The Lens `post()` / `editPost()` calls.
- The success dialog with share actions.
- The editor, autosave, and draft system.

### What changes

The submit button click splits into two phases with a redirect in between.

---

### New Click N+1: User clicks "Publish" (submit)

**Phase A: Save to Supabase (~200ms)**

```
Button text:  "Publish" → "Saving..."  (disabled, brief)
Toast:        none (too fast to need one)

1. Validate form (same as today)
2. Check wallet connection (same as today)
3. Build the post record with FULL content:
   - title, subtitle, cover_url
   - content_json (Plate.js JSON from draft)
   - content_markdown (from draft autosave)
   - content_html (from draft autosave)
   - slug, tags, handle, author
   - blog_address (from distribution settings)
   - publish_status = "pending"
   - collecting_settings (JSON blob for retry)
   - distribution_settings (JSON blob for retry)
4. POST /api/posts (extended to accept full content)
5. Delete the cloud draft (same as today, but earlier)
6. Close the dialog
7. router.push(/p/{username}/{slug})  ← NO ?success=true yet
```

**The post now exists in Supabase. The user sees it immediately.**

**Phase B: Publish to Lens (background, ~10-30s)**

This happens ON the post page, not in the dialog. The user is already reading their post.

```
Post page renders from Supabase content.
PublishStatusBadge shows: ⏳ "Publishing to Lens..."

1. Build Lens article metadata (same construction as today)
2. Upload to Grove → get contentUri
3. Resolve feed address from blog
4. Build collect actions from saved collecting_settings
5. WALLET POPUP appears → user signs
6. Wait for transaction indexing
7. PATCH /api/posts/status:
   - On success: publish_status = "confirmed", lens_post_id = ..., content_uri = ...
   - On failure: publish_status = "failed"
8. Badge updates: ✓ "On-chain" (green) or ⚠️ "Off-chain" (red)
```

**Phase C: Success state**

When `publish_status` flips to `"confirmed"`:
- Badge turns green.
- Success dialog appears (same "Post Published!" dialog with share actions).
- Newsletter campaign fires (only after Lens confirmation).

---

### New Click N+2: User sees the post page

**Immediately after redirect (publish_status = "pending"):**

```
┌─────────────────────────────────────────────┐
│  [Author Avatar]  username  •  Just now      │
│                                              │
│  ⏳ Publishing to Lens...                    │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │                                     │     │
│  │         [Cover Image]               │     │
│  │                                     │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  # Article Title                             │
│                                              │
│  Full article content rendered from          │
│  Supabase content_json via Plate.js          │
│  editor in read-only mode.                   │
│                                              │
│  ─────────────────────────────────────────   │
│  [♡ Like]  [💰 Collect/Tip]  [🔖]  [↗ Share]│
│                                              │
│  Tags: #web3 #publishing                     │
│                                              │
│  ┌─ Storage ─────────────────────────┐       │
│  │  ⏳ Pending on-chain confirmation │       │
│  └───────────────────────────────────┘       │
└─────────────────────────────────────────────┘

  Wallet popup appears asking user to sign...
```

**After Lens confirms (publish_status = "confirmed"):**

```
┌─────────────────────────────────────────────┐
│  [Author Avatar]  username  •  Just now      │
│                                              │
│  ✓ On-chain                                  │
│                                              │
│  ... same article content ...                │
│                                              │
│  ┌─ Storage ─────────────────────────┐       │
│  │  Grove  lens://abc123...          │       │
│  └───────────────────────────────────┘       │
└─────────────────────────────────────────────┘

  ┌──────────────────────────────────┐
  │       Post Published! 🎉         │
  │                                  │
  │  Share to Bluesky                │
  │  Share to X                      │
  │  Copy Link                       │
  │  [View Post]                     │
  └──────────────────────────────────┘
```

**If Lens fails (publish_status = "failed"):**

```
┌─────────────────────────────────────────────┐
│  [Author Avatar]  username  •  Just now      │
│                                              │
│  ⚠️ Off-chain  [Retry]                       │
│                                              │
│  ... same article content ...                │
│                                              │
│  ┌─ Storage ─────────────────────────┐       │
│  │  ⚠️ Not yet stored on-chain      │       │
│  │  Content is saved locally.        │       │
│  │  Click Retry to publish to Lens.  │       │
│  └───────────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

Clicking **Retry** re-runs Phase B: rebuilds metadata from the Supabase content, uploads to Grove, triggers wallet popup, updates status.

---

### Side-by-Side: Dialog Submit Moment

```
TODAY                                    AFTER
─────────────────────────────────────    ─────────────────────────────────────
User clicks "Publish"                    User clicks "Publish"
  │                                        │
  ├─ Button: "Publishing..." (disabled)    ├─ Button: "Saving..." (disabled)
  ├─ Toast: "Publishing post..."           ├─ ~200ms: save to Supabase
  ├─ ~2s: upload to Grove                  ├─ Draft deleted
  ├─ ~1s: resolve feed                     ├─ Dialog closes
  ├─ Wallet popup → user signs             ├─ Redirect to post page
  ├─ ~10s: wait for indexing               │
  ├─ ~1s: fetch post by hash              POST PAGE:
  ├─ Toast: "Published!"                   ├─ Badge: ⏳ "Publishing..."
  ├─ Delete draft                          ├─ Content visible from Supabase
  ├─ Create post record                    ├─ ~2s: upload to Grove
  ├─ Dialog closes                         ├─ Wallet popup → user signs
  ├─ Redirect to post page                 ├─ ~10s: wait for indexing
  │                                        ├─ Badge: ✓ "On-chain"
  Total blocking time: ~15-30s             ├─ Success dialog appears
  User sees nothing until done             │
                                           Blocking time in dialog: ~200ms
                                           User sees their post immediately
```

---

### The Publish Dialog Changes (Minimal)

The 3-tab dialog itself barely changes. The only differences:

| Element | Today | After |
|---------|-------|-------|
| Submit button label | "Publishing..." / "Updating..." | "Saving..." (brief) |
| Submit button disabled time | 15-30 seconds | <1 second |
| Loading toast | "Publishing post..." (long) | None needed (too fast) |
| Success toast | In dialog context | On post page, after Lens confirms |
| Error handling | All errors in dialog | Supabase save errors in dialog; Lens errors on post page |
| Dialog close | After Lens confirms | After Supabase save |
| Wallet popup | While dialog is open | On the post page |

The form fields, validation, tabs, auto-sync, and visual states all remain identical.

---

### The Post Page Changes

| Element | Today | After |
|---------|-------|-------|
| Content source | `fetchPost(lens)` → extract from metadata attributes | `getPostFromSupabase()` → read content_json directly |
| SEO metadata | From Lens post metadata | From Supabase posts row |
| Success dialog trigger | `?success=true` query param on redirect | `publish_status` changing to `"confirmed"` |
| Post metadata card (Storage tab) | Always shows Grove/IPFS URI | Shows URI when confirmed, "Pending" when pending, "Not stored" when failed |
| New component | — | `PublishStatusBadge` (✓/⏳/⚠️) |
| New component | — | Retry button (visible when `publish_status === "failed"`, author only) |
| Lens publish trigger | — | `publishPostToLens()` runs on mount when `publish_status === "pending"` |

---

### Blog Page Changes

| Element | Today | After |
|---------|-------|-------|
| Post listing source | `fetchPosts(lens, { filter })` | `SELECT * FROM posts WHERE blog_address = ... AND publish_status IN ('pending','confirmed')` |
| Post cards | Receive Lens `Post` objects | Receive Supabase post rows (same visual, different data source) |
| Each card | No status indicator | `PublishStatusBadge` on each card |

---

### Feed / Home Page Changes

Feed components (`feed-articles.tsx`, `feed-latest.tsx`, etc.) currently fetch from Lens. These can be migrated incrementally:

1. **Phase 1:** Post pages and blog pages read from Supabase (the author's own content).
2. **Phase 2:** Feed pages read from Supabase for Fountain.ink posts, Lens for external Lens posts.

This is a separate concern from the publishing flow and can happen later.

---

### Retry Flow (New)

When a user visits their post with `publish_status === "failed"`:

```
1. User sees their post (content from Supabase) with ⚠️ badge
2. User clicks "Retry"
3. Badge changes to ⏳ "Publishing..."
4. Metadata rebuilt from Supabase content (content_json, title, tags, etc.)
5. Upload to Grove
6. Wallet popup → user signs
7. Wait for indexing
8. On success: badge → ✓, status → "confirmed", success dialog appears
9. On failure: badge → ⚠️, toast.error with reason
```

The retry function reads everything it needs from the `posts` table — it doesn't need a draft. This is why the extended posts table stores `collecting_settings` and `distribution_settings` as JSON blobs: so retry has access to monetization and feed configuration without the original draft.

---

### Edit Flow Changes

**Today:**
1. User clicks "Edit post" in post menu → creates a new draft from published content → redirects to `/w/[documentId]`.
2. User edits in the editor.
3. User opens publish dialog → clicks "Update Post".
4. Same blocking flow: upload → wallet → wait → redirect with `?updated=true`.

**After:**
1. Same: Edit → new draft → editor.
2. Same: Edit in editor.
3. User opens publish dialog → clicks "Update Post".
4. **Phase A:** UPDATE the Supabase `posts` row with new content + `publish_status = "pending"`. Delete draft. Close dialog. Redirect.
5. **Phase B:** On post page, `editPost()` on Lens in background. Badge shows ⏳ → ✓/⚠️.

The edit flow mirrors the new post flow exactly. The only difference is `editPost()` instead of `post()` on Lens, and the Supabase operation is UPDATE instead of INSERT.

---

## Implementation Sequence (Publishing Flow Only)

| Step | What | Files |
|------|------|-------|
| 1 | Extend `posts` table with content + status columns | New migration SQL |
| 2 | Regenerate DB types | `src/lib/db/database.ts` |
| 3 | Extend `POST /api/posts` to accept full content | `src/app/api/posts/route.ts` |
| 4 | New `PATCH /api/posts/status` endpoint | `src/app/api/posts/status/route.ts` (new) |
| 5 | New `savePostToSupabase()` function | `src/lib/publish/save-post.ts` (new) |
| 6 | New `publishPostToLens()` function | `src/lib/publish/publish-post-to-lens.ts` (new) |
| 7 | Refactor `publishPost()` to call save → redirect → Lens | `src/lib/publish/publish-post.ts` |
| 8 | Refactor `publishPostEdit()` same way | `src/lib/publish/publish-post-edit.ts` |
| 9 | New `PublishStatusBadge` component | `src/components/post/publish-status-badge.tsx` (new) |
| 10 | New `retryPublish()` function | `src/lib/publish/retry-publish.ts` (new) |
| 11 | Update post page to read from Supabase + show badge + trigger Lens publish | `src/app/p/[user]/[post]/page.tsx` |
| 12 | Update post layout for Supabase-based SEO | `src/app/p/[user]/[post]/layout.tsx` |
| 13 | Move success dialog trigger from `?success=true` to status change | `src/app/p/[user]/[post]/template.tsx` |
| 14 | Update post metadata card for pending/failed states | `src/components/post/post-metadata.tsx` |
| 15 | Update blog page to list from Supabase | `src/app/b/[blog]/page.tsx` |
