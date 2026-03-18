"use client";

import { useState } from "react";
import { BoardPost } from "@/lib/domain/boards/types";
import { BoardPostCard } from "./board-post-card";

interface BoardPostListProps {
  boardId: string;
  feedAddress: string;
  initialPosts: BoardPost[];
  initialNextCursor: string | null;
}

export function BoardPostList({
  boardId,
  feedAddress,
  initialPosts,
  initialNextCursor,
}: BoardPostListProps) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      const actions = await import("@/app/boards/[address]/actions") as any;
      const result = await actions.loadMoreBoardPosts(boardId, feedAddress, nextCursor);
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
          No posts yet. Be the first to create a post!
        </p>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-400 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-500 dark:text-gray-400">
            <th className="w-[58%] pb-3 pr-2">Topic</th>
            <th className="relative w-[12%] pb-3 text-center before:absolute before:left-0 before:top-1/2 before:h-[60%] before:-translate-y-1/2 before:border-l before:border-slate-300 dark:before:border-gray-600">Started by</th>
            <th className="relative w-[10%] pb-3 text-center before:absolute before:left-0 before:top-1/2 before:h-[60%] before:-translate-y-1/2 before:border-l before:border-slate-300 dark:before:border-gray-600">Replies</th>
            <th className="relative w-[10%] pb-3 text-center before:absolute before:left-0 before:top-1/2 before:h-[60%] before:-translate-y-1/2 before:border-l before:border-slate-300 dark:before:border-gray-600">Views</th>
            <th className="relative w-[10%] pb-3 text-center before:absolute before:left-0 before:top-1/2 before:h-[60%] before:-translate-y-1/2 before:border-l before:border-slate-300 dark:before:border-gray-600">Activity</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <BoardPostCard key={post.id} post={post} />
          ))}
        </tbody>
      </table>

      {nextCursor && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
