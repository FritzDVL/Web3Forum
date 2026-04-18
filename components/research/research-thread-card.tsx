"use client";

import { ResearchThread } from "@/lib/domain/research/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-blue-500",
  "state-machine": "bg-purple-500",
  consensus: "bg-orange-500",
  cryptography: "bg-red-500",
  "account-system": "bg-cyan-500",
  security: "bg-yellow-500",
};

interface ResearchThreadCardProps {
  thread: ResearchThread;
}

export function ResearchThreadCard({ thread }: ResearchThreadCardProps) {
  const authorName = thread.post?.author?.username?.localName
    || thread.post?.author?.address?.slice(0, 8)
    || "Unknown";

  // Use publication ID for pending posts, lensPostId for confirmed
  const threadHref = thread.lensPostId?.startsWith("pending-")
    ? "#"
    : `/research/thread/${thread.lensPostId}`;

  return (
    <Link
      href={threadHref}
      className="grid grid-cols-[1fr_100px_70px_70px_90px] items-center gap-2 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50"
    >
      <div className="min-w-0">
        <h3 className="truncate text-base font-medium text-blue-600 dark:text-blue-400">
          {thread.title}
        </h3>
        <div className="mt-1 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${CATEGORY_COLORS[thread.category.slug] || "bg-gray-400"}`} />
            {thread.category.name}
          </span>
          {thread.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 dark:text-gray-400">#{tag}</span>
          ))}
        </div>
      </div>
      <span className="truncate text-center text-sm text-gray-600 dark:text-gray-400">
        {authorName}
      </span>
      <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
        {thread.totalPosts}
      </span>
      <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
        {thread.viewsCount}
      </span>
      <span className="text-center text-xs text-gray-500 dark:text-gray-400">
        {formatCompactTime(thread.lastActivityAt || thread.createdAt)}
      </span>
    </Link>
  );
}
