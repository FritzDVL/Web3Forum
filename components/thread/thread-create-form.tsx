"use client";

import { TextEditor } from "@/components/editor/text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/ui/tags-input";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { useThreadCreateForm } from "@/hooks/forms/use-thread-create-form";
import { Community } from "@/lib/domain/communities/types";
import { useAuthStore } from "@/stores/auth-store";
import { Send } from "lucide-react";

interface ThreadCreateFormProps {
  community: Community;
}

export function ThreadCreateForm({ community }: ThreadCreateFormProps) {
  const { account } = useAuthStore();
  const { formData, setFormData, handleChange, handleSubmit, isCreating } = useThreadCreateForm({
    community,
    author: account?.address || "",
  });
  const { tags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();

  const suggestedTags = [
    "discussion",
    "help",
    "development",
    "question",
    "announcement",
    "tutorial",
    "feedback",
    "showcase",
    "governance",
    "research",
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newFormData = { ...formData, tags: tags.join(",") };
    setFormData(newFormData);
    handleSubmit(e, newFormData);
  };

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">Create New Thread</h1>
        <p className="text-muted-foreground">Share your thoughts with the community</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleChange("title", e.target.value)}
              placeholder="What's your thread about?"
              required
            />
          </div>
          {/* Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-foreground">
              Content
            </Label>
            <div className="bg-white/50backdrop-blur-sm rounded-2xl border-brand-200/40 dark:bg-gray-800">
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
              suggestedTags={suggestedTags}
              maxTags={5}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isCreating || !formData.title.trim() || !formData.content.trim()}
              className="rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Publishing...
                </div>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Thread
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
