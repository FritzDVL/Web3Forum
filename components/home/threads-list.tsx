import { ThreadListItem } from "@/components/home/thread-list-item";
import { StatusBanner } from "@/components/shared/status-banner";
import { Button } from "@/components/ui/button";
import { Thread } from "@/lib/domain/threads/types";
import { Edit3, MessageCircle } from "lucide-react";

interface LatestThreadsProps {
  threads: Thread[];
  loadingThreads: boolean;
  error: any;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export function ThreadsList({ threads, loadingThreads, error, activeCategory, setActiveCategory }: LatestThreadsProps) {
  return (
    <div className="mb-8 w-full max-w-none overflow-hidden rounded-3xl border border-slate-300/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800 md:max-w-none">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-100/90 to-white px-4 py-4 dark:border-gray-700/50 dark:from-gray-800/50 dark:to-gray-800 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Active threads</h2>
              <div className="relative">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></div>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
              Join the discussion and share your insights
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            {["Featured", "Latest"].map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "border border-brand-200/50 bg-brand-100 text-brand-700 shadow-sm dark:border-brand-700/50 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full max-w-full overflow-x-auto p-4 sm:p-8">
        {loadingThreads ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-gray-700"></div>
                    <div className="h-3 w-1/4 rounded-lg bg-slate-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16">
            <StatusBanner type="error" title={error.message || "Failed to load threads"} icon={null} />
          </div>
        ) : threads.length === 0 ? (
          <div className="py-20">
            <StatusBanner
              type="info"
              title="No threads yet"
              message="Be the first to start a meaningful conversation"
              icon={<MessageCircle className="h-10 w-10 text-slate-400 dark:text-gray-500" />}
            />
            <div className="mt-8 flex justify-center">
              <Button className="rounded-full bg-brand-600 px-8 py-3 text-white hover:bg-brand-700">
                <Edit3 className="mr-2 h-4 w-4" />
                Create Thread
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-full space-y-6">
            {threads.map(thread => (
              <ThreadListItem key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
