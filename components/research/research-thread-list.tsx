"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResearchThread, ResearchCategory } from "@/lib/domain/research/types";
import { ResearchThreadCard } from "./research-thread-card";
import { ResearchSortFilter } from "./research-sort-filter";
import { getResearchThreads } from "@/lib/services/research/get-research-threads";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ResearchThreadListProps {
  initialThreads: ResearchThread[];
  categories: ResearchCategory[];
  allTags: string[];
}

export function ResearchThreadList({ initialThreads, categories, allTags }: ResearchThreadListProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLatest = !activeCategory && !activeTag;

  useEffect(() => {
    async function refetch() {
      setLoading(true);
      const result = await getResearchThreads({
        categorySlug: activeCategory || undefined,
        tag: activeTag || undefined,
        limit: 20,
      });
      if (result.success && result.threads) {
        setThreads(result.threads);
      }
      setLoading(false);
    }
    if (activeCategory !== null || activeTag !== null) {
      refetch();
    } else {
      setThreads(initialThreads);
    }
  }, [activeCategory, activeTag, initialThreads]);

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveTag(null);
  };

  return (
    <div>
      {/* Toolbar row: Categories + Tags + Latest + New Topic button */}
      <div className="mb-6 flex items-center gap-3">
        {/* Dropdowns */}
        <ResearchSortFilter
          categories={categories}
          activeCategory={activeCategory}
          activeTag={activeTag}
          allTags={allTags}
          onCategoryChange={setActiveCategory}
          onTagChange={setActiveTag}
        />

        {/* Latest tab */}
        <button
          onClick={clearFilters}
          className={`relative pb-1 text-sm font-medium transition-colors ${
            isLatest
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Latest
          {isLatest && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </button>

        {/* Spacer + New Topic */}
        <div className="ml-auto">
          <Link href="/research/new">
            <Button size="sm" className="gradient-button">
              <Plus className="mr-2 h-4 w-4" />
              New Topic
            </Button>
          </Link>
        </div>
      </div>

      {/* Thread list */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No topics yet. Be the first to start a discussion!
        </div>
      ) : (
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
            {threads.map((thread) => (
              <ResearchThreadCard key={thread.lensPostId} thread={thread} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
