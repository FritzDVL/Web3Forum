"use client";

import { ResearchThread } from "@/lib/domain/research/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-blue-500",
  "state-machine": "bg-purple-500",
  objects: "bg-emerald-500",
  consensus: "bg-orange-500",
  cryptography: "bg-red-500",
  "account-system": "bg-cyan-500",
  security: "bg-yellow-500",
};

interface ResearchThreadCardProps {
  thread: ResearchThread;
}

export function ResearchThreadCard({ thread }: ResearchThreadCardProps) {
  const author = thread.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const avatarUrl = author.metadata?.picture || undefined;

  return (
    <tr className="border-b border-slate-300 transition-colors hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-800/50">
      <td className="w-[58%] py-3 pr-2">
        <Link href={`/research/thread/${thread.lensPostId}`} className="text-lg font-medium text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
          {thread.title}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-gray-300">
            <span className={`inline-block h-3 w-3 ${CATEGORY_COLORS[thread.category.slug] || "bg-gray-400"}`} /> {thread.category.name}
          </span>
          {thread.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-block h-2.5 w-2.5 bg-gray-400" /> {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="w-[12%] py-3 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/u/${authorName}`} className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400">
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-semibold text-white">
              {authorName[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {authorName}
        </Link>
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {thread.totalPosts}
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {thread.viewsCount}
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {formatCompactTime(thread.lastActivityAt || thread.createdAt)}
      </td>
    </tr>
  );
}
