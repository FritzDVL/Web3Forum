"use client";

import { useRef, useEffect } from "react";
import { ResearchThread, ResearchPublication } from "@/lib/domain/research/types";
import { ResearchPostList } from "./research-post-list";
import { ResearchReplyEditor } from "./research-reply-editor";
import { useResearchResponseCreate } from "@/hooks/research/use-research-response-create";
import { Eye, MessageSquare } from "lucide-react";

interface ResearchThreadViewProps {
  thread: ResearchThread;
  publications: ResearchPublication[];
}

export function ResearchThreadView({ thread, publications }: ResearchThreadViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const {
    content, setContent,
    isSubmitting, editorKey,
    handleSubmit, insertQuote,
  } = useResearchResponseCreate(thread.lensPostId);

  const handleReply = (quotedText: string, authorName: string) => {
    insertQuote(quotedText, authorName);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Scroll to post anchor on load (e.g. #post-3)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
          {thread.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {thread.category.name}
          </span>
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-gray-700 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {thread.totalPosts} posts
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {thread.viewsCount} views
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <ResearchPostList publications={publications} threadId={thread.lensPostId} onReply={handleReply} />

        <div ref={editorRef}>
          <ResearchReplyEditor
            content={content}
            onContentChange={setContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            editorKey={editorKey}
          />
        </div>
      </div>
    </div>
  );
}
