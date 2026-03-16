"use client";

import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { BoardPostVoting } from "./board-post-voting";
import { BoardPost } from "@/lib/domain/boards/types";
import { LikeButton } from "@/components/ui/like-button";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { PostId } from "@lens-protocol/client";

interface BoardPostCardProps {
  post: BoardPost;
}

export function BoardPostCard({ post }: BoardPostCardProps) {
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Voting column */}
      <div className="flex flex-col items-center pt-1">
        <BoardPostVoting lensPostId={post.rootPost.id} />
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <AvatarProfileLink author={post.author} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
              <Link href={`/commons/${post.board.feedAddress}/post/${post.rootPost.id}`}>
                {post.title}
              </Link>
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link
                href={`/u/${authorName}`}
                className="font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300"
              >
                {authorName}
              </Link>
              <span>{authorHandle}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {post.summary && (
          <p className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">{post.summary}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.repliesCount} replies</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.viewsCount} views</span>
            </div>
          </div>
          <LikeButton postid={post.rootPost.id as PostId} />
        </div>
      </div>
    </div>
  );
}
