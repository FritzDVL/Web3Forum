"use client";

import { FeedPost } from "@/lib/domain/feeds/types";
import { Address } from "@/types/common";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { loadMorePosts } from "@/app/commons/[address]/actions";

interface PaginatedFeedPostsListProps {
  feedId: string;
  feedAddress: Address;
  initialPosts: FeedPost[];
  initialNextCursor: string | null;
}

export function PaginatedFeedPostsList({
  feedId,
  feedAddress,
  initialPosts,
  initialNextCursor,
}: PaginatedFeedPostsListProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoading) return;

    setIsLoading(true);
    try {
      const result = await loadMorePosts(feedId, feedAddress, nextCursor);
      
      if (result.success && result.posts) {
        setPosts([...posts, ...result.posts]);
        setNextCursor(result.nextCursor || null);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <span>{post.repliesCount} posts</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewsCount} views</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More Button */}
      {nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
