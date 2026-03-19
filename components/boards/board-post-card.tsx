"use client";

import { BoardPost } from "@/lib/domain/boards/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface BoardPostCardProps {
  post: BoardPost;
}

export function BoardPostCard({ post }: BoardPostCardProps) {
  const postUrl = `/boards/${post.board.feedAddress}/post/${post.rootPost.id}`;
  const author = post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const avatarUrl = author.metadata?.picture || undefined;

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
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-semibold text-white">
              {authorName[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {authorName}
        </Link>
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.repliesCount}
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.viewsCount}
      </td>
      <td className="w-[10%] py-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {formatCompactTime(post.lastActivityAt || post.createdAt)}
      </td>
    </tr>
  );
}
