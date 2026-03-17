"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface ResearchCategoryRow {
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  publication_count: number;
  views_count: number;
}

export async function fetchAllResearchCategories(): Promise<ResearchCategoryRow[]> {
  const { data, error } = await supabase
    .from("research_categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching research categories:", error);
    return [];
  }
  return data;
}

export async function fetchResearchCategoryBySlug(slug: string): Promise<ResearchCategoryRow | null> {
  const { data, error } = await supabase
    .from("research_categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching research category:", error);
    return null;
  }
  return data;
}

export async function incrementCategoryPublicationCount(slug: string): Promise<void> {
  const cat = await fetchResearchCategoryBySlug(slug);
  if (cat) {
    await supabase
      .from("research_categories")
      .update({ publication_count: cat.publication_count + 1 })
      .eq("slug", slug);
  }
}
