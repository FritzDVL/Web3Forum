import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleOnchainPanel } from "./article-onchain-panel";
import { ArticleViewModel } from "@/lib/services/article/get-article";

interface Props {
  article: ArticleViewModel;
}

export function ArticleView({ article }: Props) {
  const authorName = article.authorUsername || article.authorAddress.slice(0, 8);
  const timeAgo = formatDistanceToNow(new Date(article.createdAt), { addSuffix: true });

  const backHref = article.boardSlug
    ? `/boards/${article.boardSlug}/post/${article.threadSlug}`
    : `/boards`;

  const backLabel =
    article.kind === "reply" ? `Back to thread: ${article.threadTitle}` : "Back to thread";

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {article.boardSlug && (
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
          <Link href={`/boards/${article.boardSlug}`} className="hover:underline">
            {article.boardSlug}
          </Link>
          {article.kind === "reply" && (
            <span className="ml-1 text-slate-400">· reply #{article.replyPosition}</span>
          )}
        </div>
      )}

      <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 dark:text-gray-100 md:text-4xl">
        {article.title}
      </h1>

      <div className="mb-8 flex items-center gap-3 text-sm text-slate-600 dark:text-gray-400">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
            {authorName[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-slate-800 dark:text-gray-200">{authorName}</span>
        <span>·</span>
        <span>{timeAgo}</span>
      </div>

      <div className="prose prose-slate max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-4 whitespace-pre-wrap last:mb-0">{children}</p>
            ),
            br: () => <br />,
          }}
        >
          {article.content || "_No content._"}
        </ReactMarkdown>
      </div>

      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-gray-800 dark:text-gray-300"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <ArticleOnchainPanel
        publishStatus={article.publishStatus}
        lensPostId={article.lensPostId}
        contentUri={article.contentUri}
        source={article.source}
      />
    </article>
  );
}
