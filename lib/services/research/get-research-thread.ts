"use server";

import { ResearchThread, ResearchPublication } from "@/lib/domain/research/types";
import { adaptRowToCategory, adaptToThread, adaptToPublication } from "@/lib/adapters/research-adapter";
import {
  fetchResearchRootByLensId,
  fetchResearchPublicationsByRoot,
} from "@/lib/external/supabase/research-publications";
import { fetchResearchCategoryBySlug } from "@/lib/external/supabase/research-categories";
import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { Post } from "@lens-protocol/client";

export interface GetResearchThreadResult {
  success: boolean;
  thread?: ResearchThread;
  publications?: ResearchPublication[];
  error?: string;
}

export async function getResearchThread(rootLensPostId: string): Promise<GetResearchThreadResult> {
  try {
    const rootRow = await fetchResearchRootByLensId(rootLensPostId);
    if (!rootRow) {
      return { success: false, error: "Thread not found" };
    }

    const allRows = await fetchResearchPublicationsByRoot(rootLensPostId);

    const lensPostIds = allRows.map((r) => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(lensPostIds);
    const postMap = new Map<string, Post>(lensPosts.map((p) => [p.id, p]));

    const catRow = await fetchResearchCategoryBySlug(rootRow.category_slug);
    if (!catRow) {
      return { success: false, error: "Category not found" };
    }
    const category = adaptRowToCategory(catRow);

    const rootPost = postMap.get(rootRow.lens_post_id);
    if (!rootPost) {
      return { success: false, error: "Root post not found on Lens" };
    }
    const thread = adaptToThread(rootRow, rootPost, category);

    const publications: ResearchPublication[] = [];
    for (const row of allRows) {
      const lensPost = postMap.get(row.lens_post_id);
      if (lensPost) {
        publications.push(adaptToPublication(row, lensPost));
      }
    }

    return { success: true, thread, publications };
  } catch (error) {
    console.error("Failed to fetch research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch thread" };
  }
}
