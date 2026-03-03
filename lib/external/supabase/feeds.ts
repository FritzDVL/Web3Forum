"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function fetchFeedByAddress(address: string) {
  try {
    const { data, error } = await supabase
      .from("feeds")
      .select("*")
      .eq("lens_feed_address", address)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found - return null instead of throwing
        console.log(`Feed not found for address: ${address}`);
        return null;
      }
      console.error("Error fetching feed:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching feed:", error);
    return null;
  }
}

export async function fetchAllFeeds() {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching feeds:", error);
    return [];
  }

  return data;
}

export async function fetchFeedsByCategory(category: string) {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("category", category)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching feeds by category:", error);
    return [];
  }

  return data;
}
