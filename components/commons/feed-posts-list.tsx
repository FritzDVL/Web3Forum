"use client";

import Link from "next/link";
import { MessageSquare, Eye } from "lucide-react";

interface FeedPost {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  content: string;
  repliesCount: number;
  viewsCount: number;
  createdAt: string;
}

interface FeedPostsListProps {
  feedAddress: string;
}

// Mock data for visualization
const MOCK_POSTS: FeedPost[] = [
  {
    id: "1",
    title: "Welcome to Society Protocol!",
    author: "Alice",
    authorHandle: "@alice",
    content: "This is a sample post to show what the feed will look like. Posts will be fetched from Lens Protocol soon!",
    repliesCount: 12,
    viewsCount: 234,
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    title: "How does the energy system work?",
    author: "Bob",
    authorHandle: "@bob",
    content: "Can someone explain the basics of the energy system? I'm trying to understand how it integrates with the timeline...",
    repliesCount: 8,
    viewsCount: 156,
    createdAt: "5 hours ago",
  },
  {
    id: "3",
    title: "Proposal: New governance mechanism",
    author: "Charlie",
    authorHandle: "@charlie",
    content: "I'd like to propose a new approach to governance that could improve decision-making efficiency...",
    repliesCount: 23,
    viewsCount: 445,
    createdAt: "1 day ago",
  },
];

export function FeedPostsList({ feedAddress }: FeedPostsListProps) {
  return (
    <div className="space-y-4">
      {MOCK_POSTS.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          {/* Post Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                <Link href={`/commons/${feedAddress}/post/${post.id}`}>
                  {post.title}
                </Link>
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {post.author}
                </span>
                <span>{post.authorHandle}</span>
                <span>•</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Post Content Preview */}
          <p className="mt-3 line-clamp-2 text-gray-600 dark:text-gray-400">
            {post.content}
          </p>

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
      ))}

      {/* Mock Data Notice */}
      <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          📝 These are sample posts for UI preview. Real posts from Lens Protocol coming soon!
        </p>
      </div>
    </div>
  );
}
