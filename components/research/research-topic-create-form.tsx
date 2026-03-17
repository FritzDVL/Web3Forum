"use client";

import { ResearchCategory } from "@/lib/domain/research/types";
import { useResearchTopicCreate } from "@/hooks/research/use-research-topic-create";
import { TextEditor } from "@/components/editor/text-editor";
import { TagsInput } from "@/components/ui/tags-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface ResearchTopicCreateFormProps {
  categories: ResearchCategory[];
}

export function ResearchTopicCreateForm({ categories }: ResearchTopicCreateFormProps) {
  const {
    title, setTitle,
    content, setContent,
    categorySlug, setCategorySlug,
    tags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown,
    handleBlur, handleSubmit,
    isCreating, errors, touched, isFormValid,
  } = useResearchTopicCreate(categories);

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

          <div className="space-y-2">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategorySlug(cat.slug)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    categorySlug === cat.slug
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {touched.category && errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
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

          <div className="space-y-2">
            <Label>
              Tags (optional) {tags.length > 0 && <span className="text-slate-500">({tags.length}/5)</span>}
            </Label>
            <TagsInput
              tags={tags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              removeTag={removeTag}
              handleTagInputKeyDown={handleTagInputKeyDown}
              maxTags={5}
            />
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
