import { notFound } from "next/navigation";
import { getArticleByThreadSlug } from "@/lib/services/article/get-article";
import { ArticleView } from "@/components/article/article-view";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ threadSlug: string }>;
}) {
  const { threadSlug } = await params;
  const result = await getArticleByThreadSlug(threadSlug);
  if (!result.success || !result.article) notFound();
  return <ArticleView article={result.article} />;
}
