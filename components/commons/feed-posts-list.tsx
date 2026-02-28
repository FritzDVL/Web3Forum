"use client";

import Link from "next/link";
import { MessageSquare, Eye } from "lucide-react";
import { FeedPost } from "@/lib/domain/feeds/types";
import { formatDistanceToNow } from "date-fns";

interface FeedPostsListProps {
  feedAddress: string;
  posts: FeedPost[];
}

export function FeedPostsList({ feedAddress, posts }: FeedPostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          No posts yet. Be the first to create a post in this feed!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
        const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
        const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

        return (
          <div
            key={post.id}
            className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Post Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                  <Link href={`/commons/${feedAddress}/post/${post.rootPost.id}`}>
                    {post.title}
                  </Link>
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {authorName}
                  </span>
                  <span>{authorHandle}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Post Content Preview */}
            {post.summary && (
              <p className="mt-3 line-clamp-2 text-gray-600 dark:text-gray-400">
                {post.summary}
              </p>
            )}

            {/* Post Stats */}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.repliesCount} replies</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewsCount} views</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
