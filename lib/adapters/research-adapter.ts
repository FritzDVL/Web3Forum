import { ResearchCategory, ResearchThread, ResearchPublication } from "@/lib/domain/research/types";
import { ResearchCategoryRow } from "@/lib/external/supabase/research-categories";
import { ResearchPublicationRow } from "@/lib/external/supabase/research-publications";
import { Post } from "@lens-protocol/client";

export function adaptRowToCategory(row: ResearchCategoryRow): ResearchCategory {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    displayOrder: row.display_order,
    publicationCount: row.publication_count,
    viewsCount: row.views_count,
  };
}

export function adaptToThread(
  row: ResearchPublicationRow,
  lensPost: Post,
  category: ResearchCategory,
): ResearchThread {
  return {
    id: row.id,
    lensPostId: row.lens_post_id,
    post: lensPost,
    category,
    title: row.title || getArticleTitle(lensPost),
    tags: row.tags || [],
    totalPosts: row.total_posts,
    viewsCount: row.views_count,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  };
}

export function adaptToPublication(
  row: ResearchPublicationRow,
  lensPost: Post,
): ResearchPublication {
  return {
    id: row.id,
    lensPostId: row.lens_post_id,
    rootLensPostId: row.root_lens_post_id,
    post: lensPost,
    postNumber: row.post_number,
    isRoot: row.is_root,
    createdAt: row.created_at,
  };
}

function getArticleTitle(post: Post): string {
  if (post.metadata.__typename === "ArticleMetadata" && post.metadata.title) {
    return post.metadata.title;
  }
  const content = (post.metadata as any)?.content || "";
  return content.split(" ").slice(0, 8).join(" ") + "..." || "Untitled";
}
