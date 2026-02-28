"use client";

import { FeedPost } from "@/lib/domain/feeds/types";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Address } from "@/types/common";

interface PostDetailProps {
  post: FeedPost;
  feedAddress: Address;
}

export function PostDetail({ post, feedAddress }: PostDetailProps) {
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Extract content from rootPost metadata
  const content = post.rootPost.metadata?.content || post.summary || "No content available";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Link
        href={`/commons/${feedAddress}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      {/* Post Container */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Post Header */}
        <div className="border-b border-slate-200 p-6 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
            {post.title}
          </h1>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {authorName}
              </span>
              <span>{authorHandle}</span>
            </div>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>

          {/* Stats */}
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

        {/* Post Content */}
        <div className="p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {content}
            </p>
          </div>
        </div>

        {/* Reply Section Placeholder */}
        <div className="border-t border-slate-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-gray-100">
            Replies ({post.repliesCount})
          </h2>
          
          {post.repliesCount === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No replies yet. Be the first to reply!
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Reply system coming soon...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
