import { ForumThread } from "@/lib/domain/forum/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import Link from "next/link";

interface BoardPostListProps {
  boardSlug: string;
  initialPosts: ForumThread[];
}

export function BoardPostList({ boardSlug, initialPosts }: BoardPostListProps) {
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
      <div className="grid grid-cols-[1fr_120px_80px_80px_100px] gap-2 border-b-2 border-slate-300 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
        <span>Topic</span>
        <span className="text-center">Started by</span>
        <span className="text-center">Replies</span>
        <span className="text-center">Views</span>
        <span className="text-center">Activity</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-gray-700">
        {initialPosts.map((post) => {
          const authorName = post.authorUsername || post.authorAddress.slice(0, 8);
          return (
            <div key={post.id}>
              <Link
                href={`/boards/${post.boardSlug}/post/${post.id}`}
                className="flex items-center gap-2 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-blue-600 dark:text-blue-400">
                    {post.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    by {authorName} · {formatCompactTime(post.createdAt)} · {post.replyCount} replies · {post.viewsCount} views
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
