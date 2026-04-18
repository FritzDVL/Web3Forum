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

    const catRow = await fetchResearchCategoryBySlug(rootRow.category_slug);
    if (!catRow) {
      return { success: false, error: "Category not found" };
    }
    const category = adaptRowToCategory(catRow);

    // Try to fetch Lens posts, but don't fail if unavailable
    let postMap = new Map<string, Post>();
    try {
      const lensPostIds = allRows
        .filter((r) => r.lens_post_id && !r.lens_post_id.startsWith("pending-"))
        .map((r) => r.lens_post_id);
      if (lensPostIds.length > 0) {
        const lensPosts = await fetchPostsBatch(lensPostIds);
        postMap = new Map(lensPosts.map((p) => [p.id, p]));
      }
    } catch {
      // Lens unavailable — continue with Supabase-only data
    }

    const rootPost = postMap.get(rootRow.lens_post_id);
    const thread: ResearchThread = rootPost
      ? adaptToThread(rootRow, rootPost, category)
      : {
          id: rootRow.id,
          lensPostId: rootRow.lens_post_id,
          post: null as any,
          category,
          title: rootRow.title || "Untitled",
          tags: rootRow.tags || [],
          totalPosts: rootRow.total_posts,
          viewsCount: rootRow.views_count,
          lastActivityAt: rootRow.last_activity_at,
          createdAt: rootRow.created_at,
        };

    const publications: ResearchPublication[] = allRows.map((row) => {
      const lensPost = postMap.get(row.lens_post_id);
      if (lensPost) {
        return adaptToPublication(row, lensPost);
      }
      // Fallback: build from Supabase data
      return {
        id: row.id,
        lensPostId: row.lens_post_id,
        rootLensPostId: row.root_lens_post_id,
        post: null as any,
        postNumber: row.post_number,
        isRoot: row.is_root,
        createdAt: row.created_at,
      };
    });

    return { success: true, thread, publications };
  } catch (error) {
    console.error("Failed to fetch research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch thread" };
  }
}
