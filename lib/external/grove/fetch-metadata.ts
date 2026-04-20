/**
 * Fetch a Lens article metadata JSON document from Grove (or any HTTP URI).
 * Returns null on failure — callers should fall back to Supabase content.
 */
export interface LensArticleMetadata {
  $schema?: string;
  lens?: {
    title?: string;
    content?: string;
    tags?: string[];
    locale?: string;
    attributes?: Array<{ key: string; type: string; value: string }>;
    mainContentFocus?: string;
  };
  // Some metadata variants put fields at the top level
  title?: string;
  content?: string;
  tags?: string[];
  attributes?: Array<{ key: string; type: string; value: string }>;
}

/** Convert lens://... or http(s)://... to a fetchable HTTPS URL via the public Grove gateway. */
export function groveUriToHttpUrl(uri: string): string | null {
  if (!uri) return null;
  if (uri.startsWith("lens://")) {
    return `https://api.grove.storage/${uri.slice("lens://".length)}`;
  }
  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return uri;
  }
  return null;
}

export async function fetchArticleMetadata(
  contentUri: string | null | undefined,
): Promise<LensArticleMetadata | null> {
  if (!contentUri) return null;
  const url = groveUriToHttpUrl(contentUri);
  if (!url) return null;

  try {
    const res = await fetch(url, {
      // Always fresh — content is content-addressed so it's safe to cache,
      // but we don't want stale errors during indexer races.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as LensArticleMetadata;
    return json;
  } catch (err) {
    console.warn("[grove] fetchArticleMetadata failed:", err);
    return null;
  }
}

/** Normalize a metadata doc to a flat shape the article view can consume. */
export interface NormalizedArticle {
  title: string | null;
  content: string | null;
  tags: string[];
  attributes: Record<string, string>;
}

export function normalizeArticleMetadata(
  meta: LensArticleMetadata | null,
): NormalizedArticle | null {
  if (!meta) return null;
  const lens = meta.lens || {};
  const title = lens.title ?? meta.title ?? null;
  const content = lens.content ?? meta.content ?? null;
  const tags = lens.tags ?? meta.tags ?? [];
  const rawAttrs = lens.attributes ?? meta.attributes ?? [];
  const attributes: Record<string, string> = {};
  for (const a of rawAttrs) {
    if (a && typeof a.key === "string") attributes[a.key] = String(a.value);
  }
  return { title, content, tags, attributes };
}
