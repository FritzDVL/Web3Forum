import Link from "next/link";
import { ResearchThread } from "@/lib/domain/research/types";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { MessageSquare, Eye } from "lucide-react";
import { getTimeAgo } from "@/lib/shared/utils";

interface ResearchThreadCardProps {
  thread: ResearchThread;
}

export function ResearchThreadCard({ thread }: ResearchThreadCardProps) {
  const author = thread.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const timeAgo = getTimeAgo(new Date(thread.createdAt));

  return (
    <Link
      href={`/research/thread/${thread.lensPostId}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
    >
      <div className="flex items-start gap-4">
        <AvatarProfileLink author={author} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            {thread.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>by @{authorName}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            <span>·</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {thread.category.name}
            </span>
          </div>
          {thread.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-gray-700 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.totalPosts} {thread.totalPosts === 1 ? "post" : "posts"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{thread.viewsCount} views</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
