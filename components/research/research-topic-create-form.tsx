"use client";

import { useState, useRef, useEffect } from "react";
import { ResearchCategory } from "@/lib/domain/research/types";
import { useResearchTopicCreate } from "@/hooks/research/use-research-topic-create";
import { TextEditor } from "@/components/editor/text-editor";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, ChevronDown, X } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-blue-500",
  "state-machine": "bg-purple-500",
  objects: "bg-emerald-500",
  consensus: "bg-orange-500",
  cryptography: "bg-red-500",
  "account-system": "bg-cyan-500",
  security: "bg-yellow-500",
  uncategorized: "bg-gray-400",
};

const DEFAULT_TAGS = [
  "Hunting", "Property", "Parenting", "Governance", "Organizations",
  "Curation", "Farming", "Portal", "Communication",
];

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

interface ResearchTopicCreateFormProps {
  categories: ResearchCategory[];
}

export function ResearchTopicCreateForm({ categories }: ResearchTopicCreateFormProps) {
  const {
    title, setTitle,
    content, setContent,
    categorySlug, setCategorySlug,
    tags, setTags,
    handleBlur, handleSubmit,
    isCreating, errors, touched, isFormValid,
  } = useResearchTopicCreate(categories);

  const catDrop = useDropdown();
  const tagDrop = useDropdown();

  const allCategories = [
    ...categories,
    ...(categories.some(c => c.slug === "uncategorized") ? [] : [{ slug: "uncategorized", name: "Uncategorized", description: "", displayOrder: 999, publicationCount: 0, viewsCount: 0 }]),
  ];
  const activeCat = allCategories.find((c) => c.slug === categorySlug);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else if (tags.length < 4) {
      setTags([...tags, tag]);
    }
  };

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">New Research Topic</h1>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="What is this research about?"
              className={touched.title && errors.title ? "border-red-500" : ""}
            />
            {touched.title && errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Category & Tags dropdowns */}
          <div className="flex items-start gap-4">
            {/* Category dropdown (required) */}
            <div className="space-y-2">
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <div className="relative" ref={catDrop.ref}>
                <button
                  type="button"
                  onClick={() => catDrop.setOpen(!catDrop.open)}
                  onBlur={() => handleBlur("category")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                    touched.category && errors.category
                      ? "border-red-500 bg-white text-slate-700 dark:bg-gray-800 dark:text-gray-300"
                      : "border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {activeCat ? (
                    <>
                      <span className={`inline-block h-3 w-3 ${CATEGORY_COLORS[activeCat.slug] || "bg-gray-400"}`} />
                      {activeCat.name}
                    </>
                  ) : (
                    "Select Category"
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {catDrop.open && (
                  <div className="absolute left-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {allCategories.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => { setCategorySlug(cat.slug); catDrop.setOpen(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                          categorySlug === cat.slug ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
                        }`}
                      >
                        <span className={`inline-block h-3 w-3 flex-shrink-0 ${CATEGORY_COLORS[cat.slug] || "bg-gray-400"}`} />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {touched.category && errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>

            {/* Tags dropdown (optional, multi-select, max 4) */}
            <div className="space-y-2">
              <Label>
                Tags (optional) {tags.length > 0 && <span className="text-slate-500">({tags.length}/4)</span>}
              </Label>
              <div className="relative" ref={tagDrop.ref}>
                <button
                  type="button"
                  onClick={() => tagDrop.setOpen(!tagDrop.open)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {tags.length > 0 ? `${tags.length} selected` : "Select Tags"}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {tagDrop.open && (
                  <div className="absolute left-0 z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {DEFAULT_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${
                          tags.includes(tag) ? "font-semibold text-blue-600" : "text-slate-700 dark:text-gray-300"
                        }`}
                      >
                        <span className="inline-block h-2.5 w-2.5 flex-shrink-0 bg-gray-400" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-gray-700 dark:text-gray-300">
                      {tag}
                      <button type="button" onClick={() => toggleTag(tag)} className="hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Content <span className="text-red-500">*</span>
            </Label>
            <div
              className={`rounded-2xl border backdrop-blur-sm dark:bg-gray-800 ${
                touched.content && errors.content
                  ? "border-red-500 bg-red-50/50"
                  : "border-brand-200/40 bg-white/50"
              }`}
              onBlur={() => handleBlur("content")}
            >
              <TextEditor onChange={setContent} />
            </div>
            {touched.content && errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isCreating || !isFormValid} className="gap-2">
              <Send className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Topic"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
