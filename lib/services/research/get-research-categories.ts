"use server";

import { ResearchCategory } from "@/lib/domain/research/types";
import { adaptRowToCategory } from "@/lib/adapters/research-adapter";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";

export interface GetResearchCategoriesResult {
  success: boolean;
  categories?: ResearchCategory[];
  error?: string;
}

export async function getResearchCategories(): Promise<GetResearchCategoriesResult> {
  try {
    const rows = await fetchAllResearchCategories();
    return { success: true, categories: rows.map(adaptRowToCategory) };
  } catch (error) {
    console.error("Failed to fetch research categories:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch categories" };
  }
}
