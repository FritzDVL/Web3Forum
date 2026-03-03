"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ContentRenderer from "@/components/shared/content-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getThreadContent, getThreadTags, getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { Thread } from "@/lib/domain/threads/types";
import { getTimeAgo } from "@/lib/shared/utils";
import { Clock } from "lucide-react";

interface ThreadCardInfoProps {
  thread: Thread;
}

export function ThreadCardInfo({ thread }: ThreadCardInfoProps) {
  const [tags, setTags] = useState<string[]>([]);

  const isEdited = thread.rootPost?.isEdited;
  const { title, summary } = getThreadTitleAndSummary(thread.rootPost);

  // Extract thread content and image
  const { content, image, video } = getThreadContent(thread.rootPost);

  useEffect(() => {
    const doFetchTags = async () => {
      const result = await getThreadTags(thread.rootPost);
      setTags(result);
    };
    doFetchTags();
  }, [thread.rootPost]);

  return (
    <div className="space-y-3">
      {/* Header row with avatar+name on left and timestamp on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 text-sm font-bold">
            <AvatarImage src={thread.author.metadata?.picture || undefined} alt={thread.author.username?.value} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {thread.author.username?.localName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/u/${thread.author.username?.localName}`}
            className="block max-w-[8rem] truncate text-xs font-medium text-foreground"
          >
            {thread.author.username?.localName}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isEdited && (
            <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200">
              edited
            </span>
          )}
          {thread.rootPost?.timestamp && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="h-3 w-3" />
              {getTimeAgo(new Date(thread.rootPost.timestamp))}
            </span>
          )}
        </div>
      </div>
      {/* Title, summary and content in one block */}
      <div className="px-8">
        <h1 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">{title}</h1>
        {summary && (
          <p className="mt-1 max-w-2xl text-base text-sm font-medium italic text-gray-500 dark:text-gray-400">
            {summary}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <ContentRenderer
            content={{ content, image, video }}
            className="rich-text-content rounded-2xl p-0 text-foreground dark:text-gray-100"
          />
        </div>
      </div>
      {/* Tags */}
      <div className="flex flex-col gap-1">
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-block rounded-full border border-gray-200 bg-transparent px-2 py-0.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
