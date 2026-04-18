"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface ForumBoardRow {
  slug: string;
  name: string;
  description: string | null;
  section: string;
  feed_type: string;
  display_order: number;
  is_locked: boolean;
  thread_count: number;
  reply_count: number;
  views_count: number;
  last_activity_at: string | null;
  color: string | null;
}

export async function fetchAllForumBoards(): Promise<ForumBoardRow[]> {
  const { data, error } = await supabase
    .from("forum_boards")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching forum boards:", error);
    return [];
  }
  return data;
}

export async function fetchForumBoardsBySection(section: string): Promise<ForumBoardRow[]> {
  const { data, error } = await supabase
    .from("forum_boards")
    .select("*")
    .eq("section", section)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching forum boards by section:", error);
    return [];
  }
  return data;
}

export async function fetchForumBoardBySlug(slug: string): Promise<ForumBoardRow | null> {
  const { data, error } = await supabase
    .from("forum_boards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching forum board:", error);
    return null;
  }
  return data;
}

export async function incrementBoardThreadCount(boardSlug: string): Promise<void> {
  const { error } = await supabase.rpc("increment_board_thread_count", { board: boardSlug });
  if (error) console.error("Failed to increment board thread count:", error);
}
