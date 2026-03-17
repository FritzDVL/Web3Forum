"use client";

import { useState, useEffect } from "react";
import { ResearchThread, ResearchCategory } from "@/lib/domain/research/types";
import { ResearchThreadCard } from "./research-thread-card";
import { ResearchSortFilter } from "./research-sort-filter";
import { getResearchThreads } from "@/lib/services/research/get-research-threads";

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

  return (
    <div>
      <ResearchSortFilter
        categories={categories}
        activeCategory={activeCategory}
        activeTag={activeTag}
        allTags={allTags}
        onCategoryChange={setActiveCategory}
        onTagChange={setActiveTag}
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No topics yet. Be the first to start a discussion!
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ResearchThreadCard key={thread.lensPostId} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
