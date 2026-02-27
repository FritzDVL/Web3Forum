"use client";

import { TextEditor } from "@/components/editor/text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/ui/tags-input";
import { useFeedPostCreateForm } from "@/hooks/feeds/use-feed-post-create-form";
import { Address } from "@/types/common";
import { Send } from "lucide-react";

interface CreatePostFormProps {
  feedId: string;
  feedAddress: Address;
  feedTitle: string;
}

export function CreatePostForm({ feedId, feedAddress, feedTitle }: CreatePostFormProps) {
  const {
    formData,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    handleChange,
    handleSubmit,
    isCreating,
  } = useFeedPostCreateForm({ feedId, feedAddress });

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">Create New Post</h1>
        <p className="text-muted-foreground">Posting to: {feedTitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleChange("title", e.target.value)}
              placeholder="What's your post about?"
              required
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-sm font-medium text-foreground">
              Summary
            </Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={e => handleChange("summary", e.target.value)}
              placeholder="Brief description (max 100 chars)"
              maxLength={100}
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-foreground">
              Content
            </Label>
            <div className="rounded-2xl border-brand-200/40 bg-white/50 backdrop-blur-sm dark:bg-gray-800">
              <TextEditor onChange={value => handleChange("content", value)} />
            </div>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-foreground">
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

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isCreating} className="gap-2">
              <Send className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
