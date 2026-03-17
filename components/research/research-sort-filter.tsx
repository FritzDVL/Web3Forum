"use client";

import { ResearchCategory } from "@/lib/domain/research/types";

interface ResearchSortFilterProps {
  categories: ResearchCategory[];
  activeCategory: string | null;
  activeTag: string | null;
  allTags: string[];
  onCategoryChange: (slug: string | null) => void;
  onTagChange: (tag: string | null) => void;
}

export function ResearchSortFilter({
  categories,
  activeCategory,
  activeTag,
  allTags,
  onCategoryChange,
  onTagChange,
}: ResearchSortFilterProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => onCategoryChange(cat.slug === activeCategory ? null : cat.slug)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === cat.slug
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeTag && (
            <button
              onClick={() => onTagChange(null)}
              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              #{activeTag} ✕
            </button>
          )}
          {!activeTag &&
            allTags.slice(0, 15).map((tag) => (
              <button
                key={tag}
                onClick={() => onTagChange(tag)}
                className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
