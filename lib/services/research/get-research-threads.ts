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

    const lensPostIds = rows.map((r) => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(lensPostIds);
    const postMap = new Map<string, Post>(lensPosts.map((p) => [p.id, p]));

    const catRows = await fetchAllResearchCategories();
    const catMap = new Map(catRows.map((c) => [c.slug, adaptRowToCategory(c)]));

    const threads: ResearchThread[] = [];
    for (const row of rows) {
      const lensPost = postMap.get(row.lens_post_id);
      const category = catMap.get(row.category_slug);
      if (lensPost && category) {
        threads.push(adaptToThread(row, lensPost, category));
      }
    }

    return { success: true, threads };
  } catch (error) {
    console.error("Failed to fetch research threads:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch threads" };
  }
}
