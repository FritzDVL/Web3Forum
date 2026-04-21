import { storageClient } from "@/lib/external/grove/client";
import { APP_URL } from "@/lib/shared/constants";
import { Address } from "@/types/common";
import { Account, MediaImage, MediaVideo, Post } from "@lens-protocol/client";

export const THREAD_CONTENT_PREFIX = "";

export const formatThreadArticleContent = (
  content: string,
  threadUrl: string,
  title?: string,
  _summary?: string,
): string => {
  // Render the title as a plain markdown link (no heading, no bold) so the
  // post is clickable in other Lens apps without dominating the layout.
  // Falls back to plain text if no URL is available.
  const titleSection = title
    ? threadUrl
      ? `[${title}](${threadUrl})\n\n`
      : `${title}\n\n`
    : "";
  return `${titleSection}${content}`;
};

export const stripThreadArticleFormatting = (content: string): string => {
  let result = content;

  // Step 1: Remove the prefix line (LensForum Thread: URL)
  const escapedUrl = APP_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const prefixRegex = new RegExp(
    `^${THREAD_CONTENT_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}${escapedUrl}/thread/[\\w\\d-]+\\n\\n`,
  );
  result = result.replace(prefixRegex, "");

  // Step 2: Remove the leading title line if present. Handles all three
  // formats we've ever shipped:
  //   `[title](url)\n\n`        — current (plain link)
  //   `# [**title**](url)\n\n`  — previous (linked H1)
  //   `# **title**\n\n`         — legacy (plain bold H1)
  const plainLinkedTitleRegex = /^\[[^\]]*\]\([^)]*\)\n\n/;
  const linkedH1TitleRegex = /^# \[\*\*.*?\*\*\]\([^)]*\)\n\n/;
  const plainH1TitleRegex = /^# \*\*.*?\*\*\n\n/;
  result = result
    .replace(plainLinkedTitleRegex, "")
    .replace(linkedH1TitleRegex, "")
    .replace(plainH1TitleRegex, "");

  // Step 3: Remove legacy italic summary line if present (`*summary*`).
  // The summary field has been removed from the publish flow, but old posts
  // may still carry one in their on-chain metadata.
  const summaryRegex = /^\*.*?\*\n\n/;
  result = result.replace(summaryRegex, "");

  // Only trim leading whitespace, preserve trailing and internal blank lines
  return result.replace(/^\s+/, "");
};

export const stripThreadPrefixOnly = (content: string): string => {
  const escapedUrl = APP_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const prefixRegex = new RegExp(
    `^${THREAD_CONTENT_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}${escapedUrl}/thread/[\\w\\d-]+\\n\\n`,
  );
  return content.replace(prefixRegex, "");
};

export const hasThreadContentPrefix = (content: string): boolean => {
  return content.startsWith(`*${THREAD_CONTENT_PREFIX}`) || content.startsWith(THREAD_CONTENT_PREFIX);
};

export const getThreadTitleAndSummary = (rootPost: Post): { title: string; summary: string } => {
  if (rootPost.metadata.__typename === "ArticleMetadata") {
    return {
      title: rootPost.metadata.title || "Untitled Thread",
      summary: rootPost.metadata.attributes.find(attr => attr.key === "subtitle")?.value || "",
    };
  } else if (rootPost.metadata?.__typename === "TextOnlyMetadata") {
    if (rootPost.metadata?.content) {
      return {
        title: rootPost.metadata.content.split(" ").slice(0, 8).join(" ") + "...",
        summary: rootPost.metadata.content.split(" ").slice(0, 20).join(" ") + "...",
      };
    }
  } else if (rootPost.metadata?.__typename === "ImageMetadata") {
    if (rootPost.metadata?.content) {
      return {
        title: rootPost.metadata.content.split(" ").slice(0, 8).join(" ") + "...",
        summary: rootPost.metadata.content.split(" ").slice(0, 20).join(" ") + "...",
      };
    }
  } else if (rootPost.metadata?.__typename === "VideoMetadata") {
    if (rootPost.metadata?.content) {
      return {
        title: rootPost.metadata.content.split(" ").slice(0, 8).join(" ") + "...",
        summary: rootPost.metadata.content.split(" ").slice(0, 20).join(" ") + "...",
      };
    }
  }
  return {
    title: "",
    summary: "",
  };
};

export const getThreadAuthor = (author: Account) => ({
  name: author.username?.localName || "Unknown Author",
  username: author.username?.value || "unknown",
  avatar: author.metadata?.picture || "",
  reputation: author.score || 0,
  address: author.address as Address,
});

export function getThreadContent(post: Post): { content: string; image?: MediaImage; video?: MediaVideo } {
  if (!post || !post.metadata) {
    return { content: "" };
  }
  let content = "";
  if (post.metadata.__typename === "ArticleMetadata") {
    content = stripThreadArticleFormatting(post.metadata.content);
    return { content };
  }

  if (post.metadata.__typename === "TextOnlyMetadata") {
    content = post.metadata.content;
    return { content };
  }

  if (post.metadata.__typename === "ImageMetadata") {
    content = post.metadata.content;
    // Return both text and image object for rendering
    return {
      content,
      image: post.metadata.image,
    };
  }

  if (post.metadata.__typename === "VideoMetadata") {
    content = post.metadata.content;

    return {
      content,
      video: post.metadata.video,
    };
  }
  return {
    content: "",
    image: undefined,
  };
}

export const getThreadTags = async (post: Post): Promise<string[]> => {
  const resolvedUrl = storageClient.resolve(post.contentUri);

  let contentData = null;
  try {
    const contentResponse = await fetch(resolvedUrl);
    if (contentResponse.ok) {
      contentData = await contentResponse.json();
    }
  } catch (error) {
    console.warn(`Failed to fetch content for root post:`, error);
  }

  return contentData?.tags || [];
};
