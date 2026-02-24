import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, Plus, X } from "lucide-react";

interface TagsInputProps {
  tags: string[];
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  handleTagInputKeyDown: (e: React.KeyboardEvent) => void;
  suggestedTags?: string[];
  maxTags?: number;
}

export function TagsInput({
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  handleTagInputKeyDown,
  suggestedTags = [],
  maxTags = 5,
}: TagsInputProps) {
  return (
    <div className="space-y-2">
      {/* Compact input matching the rest of the form */}
      <div className="flex h-12 items-center gap-2 overflow-hidden rounded-2xl border border-brand-200/40 bg-gray-50/80 px-4 backdrop-blur-sm focus-within:ring-2 focus-within:ring-brand-200/40 dark:border-gray-700/60 dark:bg-slate-800/90">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <Input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder={tags.length === 0 ? "Add tags..." : "Add another..."}
          className="z-0 flex-1 border-none bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={tags.length >= maxTags}
        />
        {tagInput.trim() && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 w-6 rounded-full p-0 text-blue-600 hover:bg-blue-100"
            onClick={() => addTag(tagInput)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Selected tags - more compact and visible */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-200"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 rounded-full p-0 hover:bg-brand-200 dark:hover:bg-brand-800"
                onClick={() => removeTag(tag)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Suggested tags - only when necessary and more discrete */}
      {suggestedTags.length > 0 && tags.length < maxTags && tags.length === 0 && (
        <div className="pt-1">
          <p className="mb-1.5 text-xs text-muted-foreground">Popular:</p>
          <div className="flex flex-wrap gap-1">
            {suggestedTags
              .filter(tag => !tags.includes(tag))
              .slice(0, 4)
              .map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 rounded-full px-2 text-xs text-muted-foreground hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
