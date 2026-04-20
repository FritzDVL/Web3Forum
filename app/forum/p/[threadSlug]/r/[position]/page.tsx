import { notFound } from "next/navigation";
import { getReplyArticle } from "@/lib/services/article/get-article";
import { ArticleView } from "@/components/article/article-view";

export const dynamic = "force-dynamic";

export default async function ReplyArticlePage({
  params,
}: {
  params: Promise<{ threadSlug: string; position: string }>;
}) {
  const { threadSlug, position } = await params;
  const pos = Number(position);
  if (!Number.isFinite(pos) || pos <= 0) notFound();

  const result = await getReplyArticle(threadSlug, pos);
  if (!result.success || !result.article) notFound();
  return <ArticleView article={result.article} />;
}
