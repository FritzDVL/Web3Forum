import Link from "next/link";
import ContentRenderer from "../shared/content-renderer";
import { Reply } from "@/lib/domain/replies/types";
import { stripThreadPrefixOnly } from "@/lib/domain/threads/content";
import { getTimeAgo } from "@/lib/shared/utils";
import { ArrowDown, ArrowRight, ArrowUp, MessageCircle } from "lucide-react";

interface ProfileRecentActivityProps {
  replies: Reply[];
}

export function ProfileRecentActivity({ replies }: ProfileRecentActivityProps) {
  const getActivityMessage = (reply: Reply) => {
    if (reply.post.metadata.__typename === "TextOnlyMetadata") {
      return "replied to";
    }
    if (reply.post.metadata.__typename === "ArticleMetadata") {
      return "created a thread";
    }
    return "";
  };

  const getActivityContent = (reply: Reply) => {
    let content = "";
    if (reply.post.metadata.__typename === "TextOnlyMetadata") {
      content = reply.post.metadata.content || "";
    } else if (reply.post.metadata.__typename === "ArticleMetadata") {
      content = stripThreadPrefixOnly(reply.post.metadata.content || "");
    }
    // Limit to 120 chars, add ellipsis if longer
    return content.length > 200 ? content.slice(0, 200) + "..." : content;
  };

  if (replies.length > 0) {
    return (
      <div className="space-y-3">
        {replies.map((reply: Reply) => (
          <div
            key={reply.id}
            className="group relative rounded-2xl border bg-white p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
          >
            <div className="space-y-3">
              <div className="text-foreground">
                <div className="mb-1 font-medium text-slate-500">{getActivityMessage(reply)}</div>
                <ContentRenderer className="rich-text-content" content={{ content: getActivityContent(reply) }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-slate-500">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="h-4 w-4 text-blue-500" />
                    <span>{reply.post.stats.upvotes || 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDown className="h-4 w-4 text-red-400" />
                    <span>{reply.post.stats.downvotes || 0}</span>
                  </span>
                  <span className="text-slate-400">{getTimeAgo(new Date(reply.post.timestamp))}</span>
                </div>
                {reply.thread && reply.post.metadata.__typename === "TextOnlyMetadata" && (
                  <Link
                    href={`/thread/${reply.thread}/reply/${reply.id}`}
                    className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    View Reply
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {reply.thread && reply.post.metadata.__typename === "ArticleMetadata" && (
                  <Link
                    href={`/thread/${reply.thread}`}
                    className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    View Thread
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <MessageCircle className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="mb-2 text-lg font-medium text-slate-900">No recent activity</h3>
      <p className="text-slate-500">Posts and replies will appear here</p>
    </div>
  );
}
