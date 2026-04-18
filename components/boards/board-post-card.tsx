"use client";

import { ForumThread } from "@/lib/domain/forum/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface BoardPostCardProps {
  post: ForumThread;
}

export function BoardPostCard({ post }: BoardPostCardProps) {
  const postUrl = `/boards/${post.boardSlug}/post/${post.id}`;
  const authorName = post.authorUsername || post.authorAddress.slice(0, 8);

  return (
    <tr className="border-b border-slate-300 transition-colors hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-800/50">
      <td className="w-[58%] py-5 pr-2">
        <Link href={postUrl} className="text-lg font-medium text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
          {post.title}
        </Link>
      </td>
      <td className="w-[12%] py-5 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/u/${authorName}`} className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-semibold text-white">
              {authorName[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {authorName}
        </Link>
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.replyCount}
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.viewsCount}
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {formatCompactTime(post.lastReplyAt || post.createdAt)}
      </td>
    </tr>
  );
}
