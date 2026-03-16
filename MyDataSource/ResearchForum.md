### System 2: Research Section (Article-Centric)

- **Lens Primitive:** Lens Feeds + Lens Posts (article metadata type) + GroupGatedFeedRule
- **Concept:** 7 Lens Feeds that look like boards from the outside, but inside they present an article/publication-centric layout (more like Discourse or a research journal)
- **Behavior:** When you enter the Research section, you see a different layout — articles with titles, abstracts, full content. More editorial, less conversational
- **Access:** Token-gated. Only members of a specific Lens Group (or token holders) can post. Everyone can read
- **Feeds:** The 7 Technical feeds (General Architecture, State Machine, Architectural Objects, Consensus, Cryptography, Account System, Security)

## 2. How Each System Maps to Lens Primitives

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR APP                                  │
├──────────────────┬──────────────────┬────────────────────────────┤
│   SYSTEM 1       │   SYSTEM 2       │   SYSTEM 3                 │
│   Boards         │   Research        │   Communities              │
│                  │                  │                            │
│   24 Lens Feeds  │   7 Lens Feeds   │   N Lens Groups            │
│   (open)         │   (gated)        │   (each with 1 Feed)       │
│                  │                  │                            │
│   Flat posts     │   Articles       │   Threads + replies        │
│   + comments     │   + peer review  │   (existing system)        │
│                  │   comments       │                            │
│   Board layout   │   Journal layout │   Forum layout             │
│   (Bitcointalk)  │   (Discourse)    │   (LensForum original)     │
└──────────────────┴──────────────────┴────────────────────────────┘
```

### Lens Primitives Usage Per System

| Primitive          | System 1 (Boards)     | System 2 (Research)        | System 3 (Communities)     |
| ------------------ | --------------------- | -------------------------- | -------------------------- |
| **Feed**           | 24 standalone feeds   | 7 standalone feeds (gated) | 1 per Group (auto-created) |
| **Group**          | Not used              | 1 Group for gating         | 1 per community            |
| **Post (article)** | Root posts in feed    | Research articles in feed  | Thread root posts          |
| **Comment**        | Flat replies on posts | Peer review / discussion   | Thread replies             |
| **Reaction**       | Upvote/downvote       | Upvote/downvote            | Upvote/downvote            |
| **Feed Rules**     | None (open)           | GroupGatedFeedRule         | Managed by Group           |

### System 2 (Research) — Not Built Yet

**What exists that can be reused:**

- The same Lens Feed infrastructure as Boards (feeds exist, posting works)
- `createThreadArticle` already creates article-type metadata — perfect for research
- The `is_locked` flag in Supabase already marks these 7 feeds
- The lock UI already shows on the homepage

**What needs to be built:**

1. A different page layout for `/commons/[address]` when the feed is in the `technical` category — article-centric instead of board-centric
2. Token gating enforcement — check group membership or token ownership before allowing posts
3. Article detail page with full content rendering (longer form than board posts)
4. Possibly: peer review comments with a different UI treatment than board comments

## 4. Architecture: How the Three Systems Share Code

The key insight is that all three systems use the same Lens primitives layer. The difference is in the **service layer** (business logic) and **UI layer** (presentation).

```
┌─────────────────────────────────────────────────┐
│                   UI LAYER                       │
│  Board Layout │ Research Layout │ Community Layout│
├─────────────────────────────────────────────────┤
│                SERVICE LAYER                     │
│  Board Service│ Research Service│ Community Svc  │
│  (get posts,  │ (get articles,  │ (get threads,  │
│   create post)│  gate check)    │  join group)   │
├─────────────────────────────────────────────────┤
│              LENS PRIMITIVES LAYER               │
│  (shared — articles.ts, posts.ts, groups.ts)     │
├─────────────────────────────────────────────────┤
│              SUPABASE LAYER                      │
│  feeds table │ feed_posts table │ communities    │
│              │                  │ community_threads│
└─────────────────────────────────────────────────┘
```

### What's Shared (Don't Touch)

- `lib/external/lens/primitives/` — all Lens API calls
- `lib/external/grove/` — storage client
- `lib/external/lens/protocol-client.ts` — Lens client
- `hooks/common/use-voting.ts` — voting logic
- `components/shared/content-renderer.tsx` — content display
- `stores/auth-store.ts` — authentication state

### What's System-Specific

**Research:**

- Needs new: `lib/services/research/` — article CRUD + gate check
- Needs new: `lib/adapters/research-adapter.ts` — Lens Post → Research Article
- Needs new: `components/research/` — article-centric UI
- Routes: `/commons/[address]` (same route, different layout based on category)

### Phase 2: Build Research Layout (System 2) — New UI, Same Backend (4-5 days)

The Research section uses the same Lens Feeds as Boards but with a different presentation and access control.

**Step 2.1:** Detect feed category in the commons page

- In `/commons/[address]/page.tsx`, check if `feed.category === 'technical'`
- If yes, render the Research layout instead of the Board layout

**Step 2.2:** Build Research layout components

- `components/research/research-article-list.tsx` — list of articles with title, author, abstract, date
- `components/research/research-article-detail.tsx` — full article view with content, comments
- Design should feel more like a journal/Discourse than a message board

**Step 2.3:** Implement access control

- Check if user is a member of the gating Group before showing "Create Article" button
- Use existing `GroupGatedFeedRule` on the Lens Feed (if already configured) OR
- Check membership client-side using `group.operations.isMember`
- Non-members see a "Request Access" or "Join Research Group" prompt

**Step 2.4:** Article creation form

- Reuse `createThreadArticle` — it already creates article metadata
- Add richer form: title, abstract/summary, full content, tags, references
- More editorial than the board post form

## 6. Key Decisions

1. **Research section gating mechanism:** Use `GroupGatedFeedRule` on the Lens Feed contracts (enforced on-chain) or check membership client-side? On-chain is more secure but requires updating the Feed contracts. Client-side is faster to implement but can be bypassed.

2. **Research section: same route or separate route?** Currently all feeds go to `/commons/[address]`. The Research feeds could stay there (with layout switching based on category) or get their own route like `/research/[address]`. Same route is simpler.
