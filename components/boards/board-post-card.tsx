"use client";

import { BoardPost } from "@/lib/domain/boards/types";
import { formatCompactTime } from "@/lib/shared/format-compact-time";
import Link from "next/link";

interface BoardPostCardProps {
  post: BoardPost;
}

export function BoardPostCard({ post }: BoardPostCardProps) {
  const postUrl = `/boards/${post.board.feedAddress}/post/${post.rootPost.id}`;
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);

  return (
    <tr className="border-b border-slate-300 transition-colors hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-800/50">
      <td className="w-[58%] py-3 pr-2">
        <Link href={postUrl} className="text-lg font-medium text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
          {post.title}
        </Link>
      </td>
      <td className="w-[12%] py-3 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/u/${authorName}`} className="hover:text-blue-600 dark:hover:text-blue-400">
          {authorName}
        </Link>
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.repliesCount}
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {post.viewsCount}
      </td>
      <td className="w-[10%] py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {formatCompactTime(post.lastActivityAt || post.createdAt)}
      </td>
    </tr>
  );
}
