"use server";

import { adaptFeedToBoard } from "@/lib/adapters/board-adapter";
import { Board } from "@/lib/domain/boards/types";
import { fetchAllFeeds } from "@/lib/external/supabase/feeds";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";

export interface BoardSection {
  sectionTitle: string;
  category: string;
  boards: Board[];
  /** Backward-compatible shape for homepage components (ForumCategory, FunctionGrid) */
  feeds: Array<{
    id: string;
    address: string;
    title: string;
    description: string;
    isLocked: boolean;
    featured: boolean;
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

export async function getBoardSections(): Promise<BoardSection[]> {
  const allFeeds = await fetchAllFeeds();
  const categories = ["general", "functions", "others"];

  const sections: BoardSection[] = categories.map((category) => {
    const categoryFeeds = allFeeds.filter((feed) => feed.category === category);
    const config = CATEGORY_CONFIG[category];
    const boards = categoryFeeds.map(adaptFeedToBoard);

    return {
      sectionTitle: config.title,
      category,
      boards,
      feeds: boards.map((b) => ({
        id: b.id,
        address: b.feedAddress,
        title: b.name,
        description: b.description,
        isLocked: b.isLocked,
        featured: false,
        postCount: b.postCount,
        repliesCount: b.repliesCount,
        viewsCount: b.viewsCount,
        lastPostAt: b.lastPostAt,
      })),
      borderColor: config.borderColor,
      layout: config.layout,
      isLocked: category === "technical",
    };
  });

  return sections.filter((section) => section.feeds.length > 0);
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
  const allFeeds = await fetchAllFeeds();
  const partnerFeeds = allFeeds.filter((feed) => feed.category === "partners");
  if (partnerFeeds.length === 0) return null;

  const config = CATEGORY_CONFIG["partners"];
  const boards = partnerFeeds.map(adaptFeedToBoard);

  return {
    sectionTitle: config.title,
    category: "partners",
    boards,
    feeds: boards.map((b) => ({
      id: b.id,
      address: b.feedAddress,
      title: b.name,
      description: b.description,
      isLocked: b.isLocked,
      featured: false,
      postCount: b.postCount,
      repliesCount: b.repliesCount,
      viewsCount: b.viewsCount,
      lastPostAt: b.lastPostAt,
    })),
    borderColor: config.borderColor,
    layout: config.layout,
    isLocked: false,
  };
}
