import Link from "next/link";
import { CommonsFeed } from "@/config/commons-config";

interface ForumCategoryProps {
  title: string;
  feeds: CommonsFeed[];
}

export function ForumCategory({ title, feeds }: ForumCategoryProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-l-4 border-blue-600 bg-slate-100 px-4 py-3 dark:bg-gray-700">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-gray-200">
          {title}
        </h3>
      </div>

      {/* Forum List */}
      <div className="divide-y divide-slate-200 dark:divide-gray-700">
        {feeds.map((feed) => (
          <Link
            key={feed.address}
            href={`/commons/${feed.address}`}
            className="block transition-colors hover:bg-slate-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-center justify-between px-4 py-4">
              {/* Subject Column */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  {feed.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {feed.description}
                </p>
              </div>

              {/* Stats Columns (Desktop Only) */}
              <div className="hidden md:flex items-center gap-8 ml-4">
                <div className="text-center min-w-[60px]">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Replies</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-gray-200">0</div>
                </div>
                <div className="text-center min-w-[60px]">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-gray-200">0</div>
                </div>
                <div className="text-center min-w-[100px]">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Last Post</div>
                  <div className="text-xs text-slate-600 dark:text-gray-300">Never</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
