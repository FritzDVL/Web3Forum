"use client";

import { TextEditor } from "@/components/editor/text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/ui/tags-input";
import { useBoardPostCreateForm } from "@/hooks/boards/use-board-post-create-form";
import { ForumBoard } from "@/lib/domain/forum/types";
import { Send } from "lucide-react";

interface BoardPostCreateFormProps {
  board: ForumBoard;
}

export function BoardPostCreateForm({ board }: BoardPostCreateFormProps) {
  const {
    formData,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    handleChange,
    handleBlur,
    handleSubmit,
    isCreating,
    errors,
    touched,
    isFormValid,
  } = useBoardPostCreateForm({ board });

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">Create New Post</h1>
        <p className="text-muted-foreground">Posting to: {board.name}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="What's your post about?"
              className={touched.title && errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {touched.title && errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-sm font-medium text-foreground">Summary</Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Brief description (max 100 chars)"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
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
              <TextEditor onChange={(value) => handleChange("content", value)} />
            </div>
            {touched.content && errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isCreating || !isFormValid} className="gap-2">
              <Send className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
