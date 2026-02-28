"use server";

import { fetchAllFeeds, fetchFeedsByCategory } from "@/lib/external/supabase/feeds";

export interface FeedSection {
  sectionTitle: string;
  category: string;
  feeds: Array<{
    id: string;
    address: string;
    title: string;
    description: string;
    isLocked: boolean;
    featured: boolean;
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

export async function getFeedSections(): Promise<FeedSection[]> {
  const allFeeds = await fetchAllFeeds();
  
  const categories = ["general", "partners", "functions", "technical", "others"];
  
  const sections: FeedSection[] = categories.map((category) => {
    const categoryFeeds = allFeeds.filter((feed) => feed.category === category);
    const config = CATEGORY_CONFIG[category];
    
    return {
      sectionTitle: config.title,
      category,
      feeds: categoryFeeds.map((feed) => ({
        id: feed.id,
        address: feed.lens_feed_address,
        title: feed.title,
        description: feed.description || "",
        isLocked: feed.is_locked || false,
        featured: feed.featured || false,
      })),
      borderColor: config.borderColor,
      layout: config.layout,
      isLocked: category === "technical",
    };
  });
  
  return sections.filter((section) => section.feeds.length > 0);
}
