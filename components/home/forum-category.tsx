"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface Feed {
  title: string;
  address: string;
  description: string;
  repliesCount: number;
  viewsCount: number;
  lastPostAt: string | null;
}

interface ForumCategoryProps {
  title: string;
  feeds: Feed[];
  borderColor?: string;
  isLocked?: boolean;
}

function formatLastPost(lastPostAt: string | null): string {
  if (!lastPostAt) return "Never";
  
  const date = new Date(lastPostAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ForumCategory({ title, feeds, borderColor = "blue", isLocked = false }: ForumCategoryProps) {
  const borderColorClass = borderColor === "green" ? "border-blue-600" : "border-blue-600";

  const handleLockedClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      alert("Token Required: You must hold a Society Protocol Pass to enter this research lab");
    }
  };

  return (
    <div className={`w-full overflow-hidden rounded-lg border ${isLocked ? "border-yellow-600/50 bg-[#1a1b4b]" : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800"}`}>
      {/* Header */}
      <div className={`border-l-4 ${borderColorClass} ${isLocked ? "bg-[#252663]" : "bg-slate-100 dark:bg-gray-700"} px-4 py-3`}>
        <div className="flex items-center gap-2">
          {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
          <h3 className={`text-sm font-bold uppercase tracking-wide ${isLocked ? "text-yellow-100" : "text-slate-700 dark:text-gray-200"}`}>
            {title}
          </h3>
        </div>
      </div>

      {/* Forum List */}
      <div className={`divide-y ${isLocked ? "divide-slate-600/50" : "divide-slate-200 dark:divide-gray-700"}`}>
        {feeds.map((feed) => (
          <Link
            key={feed.address}
            href={`/commons/${feed.address}`}
            onClick={handleLockedClick}
            className={`block transition-colors ${isLocked ? "hover:bg-[#252663]" : "hover:bg-slate-50 dark:hover:bg-gray-700/50"}`}
          >
            <div className="flex items-center justify-between px-4 py-4">
              {/* Subject Column */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold hover:underline ${isLocked ? "text-yellow-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {feed.title}
                </h4>
                <p className={`mt-1 text-xs ${isLocked ? "text-slate-300" : "text-gray-500 dark:text-gray-400"}`}>
                  {feed.description}
                </p>
              </div>

              {/* Stats Columns (Desktop Only) */}
              <div className="hidden md:flex items-center gap-8 ml-4">
                <div className="text-center min-w-[60px]">
                  <div className={`text-xs ${isLocked ? "text-slate-400" : "text-gray-500 dark:text-gray-400"}`}>Replies</div>
                  <div className={`text-sm font-semibold ${isLocked ? "text-slate-200" : "text-slate-700 dark:text-gray-200"}`}>
                    {feed.repliesCount.toLocaleString()}
                  </div>
                </div>
                <div className="text-center min-w-[60px]">
                  <div className={`text-xs ${isLocked ? "text-slate-400" : "text-gray-500 dark:text-gray-400"}`}>Views</div>
                  <div className={`text-sm font-semibold ${isLocked ? "text-slate-200" : "text-slate-700 dark:text-gray-200"}`}>
                    {feed.viewsCount.toLocaleString()}
                  </div>
                </div>
                <div className="text-center min-w-[100px]">
                  <div className={`text-xs ${isLocked ? "text-slate-400" : "text-gray-500 dark:text-gray-400"}`}>Last Post</div>
                  <div className={`text-xs ${isLocked ? "text-slate-300" : "text-slate-600 dark:text-gray-300"}`}>
                    {formatLastPost(feed.lastPostAt)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
