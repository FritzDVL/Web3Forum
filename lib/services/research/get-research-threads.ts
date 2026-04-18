"use server";

import { ResearchThread } from "@/lib/domain/research/types";
import { adaptRowToCategory, adaptToThread } from "@/lib/adapters/research-adapter";
import { fetchResearchThreads } from "@/lib/external/supabase/research-publications";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";
import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { Post } from "@lens-protocol/client";

export interface GetResearchThreadsResult {
  success: boolean;
  threads?: ResearchThread[];
  error?: string;
}

export async function getResearchThreads(options?: {
  categorySlug?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<GetResearchThreadsResult> {
  try {
    const rows = await fetchResearchThreads({
      categorySlug: options?.categorySlug,
      tag: options?.tag,
      limit: options?.limit || 20,
      offset: options?.offset,
    });

    if (rows.length === 0) {
      return { success: true, threads: [] };
    }

    const catRows = await fetchAllResearchCategories();
    const catMap = new Map(catRows.map((c) => [c.slug, adaptRowToCategory(c)]));

    // Try to fetch Lens posts, but don't fail if unavailable
    let postMap = new Map<string, Post>();
    try {
      const lensPostIds = rows.filter((r) => r.lens_post_id && !r.lens_post_id.startsWith("pending-")).map((r) => r.lens_post_id);
      if (lensPostIds.length > 0) {
        const lensPosts = await fetchPostsBatch(lensPostIds);
        postMap = new Map(lensPosts.map((p) => [p.id, p]));
      }
    } catch {
      // Lens unavailable — continue with Supabase-only data
    }

    const threads: ResearchThread[] = [];
    for (const row of rows) {
      const category = catMap.get(row.category_slug);
      if (!category) continue;

      const lensPost = postMap.get(row.lens_post_id);
      if (lensPost) {
        threads.push(adaptToThread(row, lensPost, category));
      } else {
        // Fallback: build thread from Supabase data only
        threads.push({
          id: row.id,
          lensPostId: row.lens_post_id,
          post: null as any, // No Lens post available
          category,
          title: row.title || "Untitled",
          tags: row.tags || [],
          totalPosts: row.total_posts,
          viewsCount: row.views_count,
          lastActivityAt: row.last_activity_at,
          createdAt: row.created_at,
        });
      }
    }

    return { success: true, threads };
  } catch (error) {
    console.error("Failed to fetch research threads:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch threads" };
  }
}
