"use client";

import { useAuthStore } from "@/stores/auth-store";
import { TextEditor } from "@/components/editor/text-editor";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ResearchReplyEditorProps {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  editorKey: number;
}

export function ResearchReplyEditor({
  content,
  onContentChange,
  onSubmit,
  isSubmitting,
  editorKey,
}: ResearchReplyEditorProps) {
  const { isLoggedIn, account } = useAuthStore();

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign in to participate in this discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 p-6 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={account?.metadata?.picture} />
          <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {account?.username?.localName?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-3">
          <TextEditor
            key={editorKey}
            onChange={onContentChange}
            initialValue={content}
          />
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!content.trim() || isSubmitting}
              className="gradient-button"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Posting..." : "Post Response"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
