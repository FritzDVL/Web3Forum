"use client";

import { useState, useRef, useEffect } from "react";
import { ResearchCategory } from "@/lib/domain/research/types";
import { ChevronDown } from "lucide-react";

// Distinct color per category
const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-blue-500",
  "state-machine": "bg-purple-500",
  objects: "bg-emerald-500",
  consensus: "bg-orange-500",
  cryptography: "bg-red-500",
  "account-system": "bg-cyan-500",
  security: "bg-yellow-500",
};

const DEFAULT_TAGS = [
  "Hunting", "Property", "Parenting", "Governance", "Organizations",
  "Curation", "Farming", "Portal", "Communication",
];

interface ResearchSortFilterProps {
  categories: ResearchCategory[];
  activeCategory: string | null;
  activeTag: string | null;
  allTags: string[];
  onCategoryChange: (slug: string | null) => void;
  onTagChange: (tag: string | null) => void;
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return { open, setOpen, ref };
}

export function ResearchSortFilter({
  categories,
  activeCategory,
  activeTag,
  allTags,
  onCategoryChange,
  onTagChange,
}: ResearchSortFilterProps) {
  const catDrop = useDropdown();
  const tagDrop = useDropdown();

  const activeCat = categories.find((c) => c.slug === activeCategory);
  const mergedTags = Array.from(new Set([...DEFAULT_TAGS, ...allTags])).sort();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category dropdown */}
      <div className="relative" ref={catDrop.ref}>
        <button
          onClick={() => catDrop.setOpen(!catDrop.open)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {activeCat ? (
            <>
              <span className={`inline-block h-3 w-3 rounded-sm ${CATEGORY_COLORS[activeCat.slug] || "bg-gray-400"}`} />
              {activeCat.name}
              <span className="text-xs text-gray-400">× {activeCat.publicationCount}</span>
            </>
          ) : (
            "All Categories"
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {catDrop.open && (
          <div className="absolute left-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => { onCategoryChange(null); catDrop.setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                !activeCategory ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { onCategoryChange(cat.slug); catDrop.setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                  activeCategory === cat.slug ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
                }`}
              >
                <span className={`inline-block h-3 w-3 flex-shrink-0 rounded-sm ${CATEGORY_COLORS[cat.slug] || "bg-gray-400"}`} />
                <span className="flex-1">{cat.name}</span>
                <span className="text-xs text-gray-400">× {cat.publicationCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag dropdown */}
      <div className="relative" ref={tagDrop.ref}>
        <button
          onClick={() => tagDrop.setOpen(!tagDrop.open)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {activeTag ? (
            <>
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-400" />
              #{activeTag}
            </>
          ) : (
            "All Tags"
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {tagDrop.open && (
          <div className="absolute left-0 z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => { onTagChange(null); tagDrop.setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                !activeTag ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
              }`}
            >
              All Tags
            </button>
            {mergedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { onTagChange(tag); tagDrop.setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                  activeTag === tag ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
                }`}
              >
                <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-gray-400" />
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
