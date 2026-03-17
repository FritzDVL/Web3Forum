"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface ResearchPublicationRow {
  id: string;
  lens_post_id: string;
  root_lens_post_id: string | null;
  category_slug: string;
  author_address: string;
  title: string | null;
  tags: string[] | null;
  post_number: number;
  views_count: number;
  total_posts: number;
  last_activity_at: string;
  is_root: boolean;
  created_at: string;
}

export async function fetchResearchThreads(options?: {
  categorySlug?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<ResearchPublicationRow[]> {
  let query = supabase
    .from("research_publications")
    .select("*")
    .eq("is_root", true)
    .order("last_activity_at", { ascending: false });

  if (options?.categorySlug) {
    query = query.eq("category_slug", options.categorySlug);
  }
  if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching research threads:", error);
    return [];
  }
  return data;
}

export async function fetchResearchRootByLensId(lensPostId: string): Promise<ResearchPublicationRow | null> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("*")
    .eq("lens_post_id", lensPostId)
    .eq("is_root", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching research root:", error);
    return null;
  }
  return data;
}

export async function fetchResearchPublicationsByRoot(rootLensPostId: string): Promise<ResearchPublicationRow[]> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("*")
    .or(`lens_post_id.eq.${rootLensPostId},root_lens_post_id.eq.${rootLensPostId}`)
    .order("post_number", { ascending: true });

  if (error) {
    console.error("Error fetching research publications:", error);
    return [];
  }
  return data;
}

export async function persistResearchPublication(params: {
  lensPostId: string;
  rootLensPostId: string | null;
  categorySlug: string;
  authorAddress: string;
  title: string | null;
  tags: string[] | null;
  postNumber: number;
  isRoot: boolean;
}): Promise<ResearchPublicationRow> {
  const { data, error } = await supabase
    .from("research_publications")
    .insert({
      lens_post_id: params.lensPostId,
      root_lens_post_id: params.rootLensPostId,
      category_slug: params.categorySlug,
      author_address: params.authorAddress,
      title: params.title,
      tags: params.tags,
      post_number: params.postNumber,
      is_root: params.isRoot,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to persist research publication: ${error.message}`);
  }
  return data;
}

export async function incrementRootPostCount(rootLensPostId: string): Promise<void> {
  const root = await fetchResearchRootByLensId(rootLensPostId);
  if (!root) return;

  await supabase
    .from("research_publications")
    .update({
      total_posts: root.total_posts + 1,
      last_activity_at: new Date().toISOString(),
    })
    .eq("lens_post_id", rootLensPostId);
}

export async function getNextPostNumber(rootLensPostId: string): Promise<number> {
  const { count, error } = await supabase
    .from("research_publications")
    .select("*", { count: "exact", head: true })
    .or(`lens_post_id.eq.${rootLensPostId},root_lens_post_id.eq.${rootLensPostId}`);

  if (error) {
    console.error("Error getting next post number:", error);
    return 1;
  }
  return (count || 0) + 1;
}

export async function incrementResearchViews(lensPostId: string): Promise<void> {
  const root = await fetchResearchRootByLensId(lensPostId);
  if (!root) return;

  await supabase
    .from("research_publications")
    .update({ views_count: root.views_count + 1 })
    .eq("lens_post_id", lensPostId);
}

export async function fetchAllResearchTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("tags")
    .eq("is_root", true)
    .not("tags", "is", null);

  if (error) {
    console.error("Error fetching research tags:", error);
    return [];
  }

  const allTags = new Set<string>();
  data.forEach((row) => {
    if (row.tags) row.tags.forEach((tag: string) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}
