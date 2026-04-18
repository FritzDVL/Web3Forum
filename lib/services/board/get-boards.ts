"use server";

import { fetchAllForumBoards, ForumBoardRow } from "@/lib/external/supabase/forum-boards";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";

export interface BoardSection {
  sectionTitle: string;
  category: string;
  feeds: Array<{
    slug: string;
    title: string;
    description: string;
    isLocked: boolean;
    postCount: number;
    repliesCount: number;
    viewsCount: number;
    lastPostAt: string | null;
  }>;
  borderColor: string;
  layout: "list" | "grid";
  isLocked: boolean;
}

const CATEGORY_CONFIG: Record<string, { title: string; layout: "list" | "grid"; borderColor: string }> = {
  general: { title: "GENERAL DISCUSSION", layout: "list", borderColor: "blue" },
  partners: { title: "PARTNER COMMUNITIES", layout: "list", borderColor: "green" },
  functions: { title: "FUNCTIONS (VALUE SYSTEM)", layout: "grid", borderColor: "blue" },
  technical: { title: "SOCIETY PROTOCOL TECHNICAL SECTION", layout: "list", borderColor: "blue" },
  others: { title: "OTHERS", layout: "list", borderColor: "blue" },
};

function boardRowToFeed(row: ForumBoardRow) {
  return {
    slug: row.slug,
    title: row.name,
    description: row.description || "",
    isLocked: row.is_locked,
    postCount: row.thread_count,
    repliesCount: row.reply_count,
    viewsCount: row.views_count,
    lastPostAt: row.last_activity_at,
  };
}

export async function getBoardSections(): Promise<BoardSection[]> {
  const allBoards = await fetchAllForumBoards();
  const categories = ["general", "functions", "others"];

  return categories
    .map((category) => {
      const config = CATEGORY_CONFIG[category];
      const boards = allBoards.filter((b) => b.section === category);
      return {
        sectionTitle: config.title,
        category,
        feeds: boards.map(boardRowToFeed),
        borderColor: config.borderColor,
        layout: config.layout,
        isLocked: category === "technical",
      };
    })
    .filter((s) => s.feeds.length > 0);
}

export interface ResearchSection {
  sectionTitle: string;
  categories: Array<{
    slug: string;
    name: string;
    description: string;
    publicationCount: number;
    viewsCount: number;
  }>;
}

export async function getResearchSection(): Promise<ResearchSection | null> {
  const rows = await fetchAllResearchCategories();
  if (rows.length === 0) return null;

  return {
    sectionTitle: "SOCIETY PROTOCOL TECHNICAL SECTION",
    categories: rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description || "",
      publicationCount: r.publication_count,
      viewsCount: r.views_count,
    })),
  };
}

export async function getPartnerSection(): Promise<BoardSection | null> {
  const allBoards = await fetchAllForumBoards();
  const partnerBoards = allBoards.filter((b) => b.section === "partners");
  if (partnerBoards.length === 0) return null;

  const config = CATEGORY_CONFIG["partners"];
  return {
    sectionTitle: config.title,
    category: "partners",
    feeds: partnerBoards.map(boardRowToFeed),
    borderColor: config.borderColor,
    layout: config.layout,
    isLocked: false,
  };
}
