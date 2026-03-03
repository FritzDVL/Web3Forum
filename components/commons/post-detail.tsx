"use client";

import { useEffect, useState } from "react";
import { FeedPost } from "@/lib/domain/feeds/types";
import { Reply } from "@/lib/services/feed/get-feed-replies";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Address } from "@/types/common";
import { Button } from "@/components/ui/button";
import { ReplyList } from "./reply-list";
import ReactMarkdown from "react-markdown";
import { stripThreadArticleFormatting } from "@/lib/domain/threads/content";

interface PostDetailProps {
  post: FeedPost;
  feedId: string;
  feedAddress: Address;
  replies: Reply[];
}

export function PostDetail({ post, feedId, feedAddress, replies }: PostDetailProps) {
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Extract content and strip ALL thread formatting (prefix, title, summary)
  const rawContent = post.rootPost.metadata?.content || post.summary || "No content available";
  const content = stripThreadArticleFormatting(rawContent);

  // Track view on mount
  useEffect(() => {
    async function trackView() {
      try {
        const response = await fetch(`/api/posts/${post.rootPost.id}/view`, {
          method: "POST",
        });
        if (response.ok) {
          setViewsCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    }
    trackView();
  }, [post.rootPost.id]);

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
              <span>{post.repliesCount} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{viewsCount} views</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert prose-p:my-4 prose-headings:mt-8 prose-headings:mb-4">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                br: () => <br className="my-2" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Reply Section */}
        <div className="border-t border-slate-200 p-6 dark:border-gray-700">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
              Replies ({replies.length})
            </h2>
            <Link href={`/commons/${feedAddress}/post/${post.rootPost.id}/reply`}>
              <Button className="gradient-button">
                Create Complete Reply
              </Button>
            </Link>
          </div>

          {/* Reply List */}
          <ReplyList replies={replies} />
        </div>
      </div>
    </div>
  );
}
