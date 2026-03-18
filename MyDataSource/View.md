## Execution Plan

### Problem

The current board post list uses card-style layout with too much info (author name, handle, time, summary, heart, icons). Needs to become
a clean forum-style table.

### Data Gap

BoardPost doesn't carry reply author data. The Lens Post object has stats.comments (count) but not the actual reply authors. We need to
fetch the first few reply authors per post to show their avatars in the "People" column.

### Steps

Step 1: Extend getBoardPosts to include reply participants

- In get-board-posts.ts, after fetching root posts, batch-fetch the first few comments per post using fetchCommentsByPostId to extract
  unique reply author Account objects (up to 4, since the OP is the 5th avatar).
- Add a participants: Account[] field to BoardPost type.
- Populate it in adaptLensPostToBoardPost or directly in the service.

Step 2: Add lastActivityAt to BoardPost

- Add lastActivityAt: string to the BoardPost interface.
- Set it to the timestamp of the most recent reply, or createdAt if no replies.
- Populated during the same fetch in Step 1.

Step 3: Rewrite board-post-card.tsx as a table row

- Single <tr> with 5 <td> cells matching the column widths (60%, 16%, 8%, 8%, 8%).
- Topic: just the title as a link.
- People: OP avatar + up to 4 participant avatars (small, side by side, not overlapping).
- Replies: just the number.
- Views: just the number.
- Activity: compact relative time ("2h", "3d", "5m").

Step 4: Rewrite board-post-list.tsx to render a <table> with header row

- Column headers: "Topic", (empty), "Replies", "Views", "Activity".
- Render each post as a BoardPostCard row.
- Keep the "Load More" button below the table.

Step 5: Add compact time formatter utility

- Small helper function: formatCompactTime(date: string): string → returns "2h", "3d", "5m", etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Files Modified

| File                                   | Change                                                  |
| -------------------------------------- | ------------------------------------------------------- |
| lib/domain/boards/types.ts             | Add participants and lastActivityAt fields to BoardPost |
| lib/adapters/board-adapter.ts          | Accept and pass through new fields                      |
| lib/services/board/get-board-posts.ts  | Fetch reply authors per post, compute lastActivityAt    |
| components/boards/board-post-card.tsx  | Full rewrite → table row                                |
| components/boards/board-post-list.tsx  | Wrap in <table> with header                             |
| New: lib/shared/format-compact-time.ts | Compact time formatter                                  |

### Risk Mitigation

- BoardPost changes are additive (new optional fields) — won't break existing consumers like board-post-detail.tsx.
- The fetchCommentsByPostId calls add N extra API calls per page load. We limit to 10 posts per page and only grab a small batch of
  comments per post, so it's manageable. If performance becomes an issue later, this can be optimized with a single batch query.

Ready to execute?
