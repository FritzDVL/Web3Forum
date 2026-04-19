import { ForumThread } from "@/lib/domain/forum/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface BoardPostListProps {
  boardSlug: string;
  initialPosts: ForumThread[];
}

const GRID_COLS =
  "grid grid-cols-[minmax(0,1fr)_140px_80px_80px_110px] gap-4 items-center";

export function BoardPostList({ boardSlug: _boardSlug, initialPosts }: BoardPostListProps) {
  if (!initialPosts || initialPosts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          No posts yet. Be the first to create a post!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div
        className={`${GRID_COLS} border-b-2 border-slate-300 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400`}
      >
        <span>Topic</span>
        <span className="text-center">Started by</span>
        <span className="text-center">Replies</span>
        <span className="text-center">Views</span>
        <span className="text-center">Activity</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:divide-gray-700">
        {initialPosts.map((post) => {
          const authorName = post.authorUsername || post.authorAddress.slice(0, 8);
          const postUrl = `/boards/${post.boardSlug}/post/${post.id}`;
          return (
            <div
              key={post.id}
              className={`${GRID_COLS} px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50`}
            >
              {/* Topic */}
              <div className="min-w-0">
                <Link
                  href={postUrl}
                  className="line-clamp-2 text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {post.title}
                </Link>
              </div>

              {/* Started by */}
              <Link
                href={`/u/${authorName}`}
                className="flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-semibold text-white">
                    {authorName[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{authorName}</span>
              </Link>

              {/* Replies */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {post.replyCount}
              </div>

              {/* Views */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {post.viewsCount}
              </div>

              {/* Activity */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {formatCompactTime(post.lastReplyAt || post.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
