/**
 * URL helpers for forum article pages.
 * All article URLs live under /forum/p/... on our own domain.
 * No external Lens client (Hey, Orb, etc.) URLs.
 */

/** Article page URL for a root forum post. */
export function getArticleUrl(threadSlug?: string | null): string | null {
  if (!threadSlug) return null;
  return `/forum/p/${threadSlug}`;
}

/** Article page URL for a forum reply. */
export function getReplyArticleUrl(
  threadSlug?: string | null,
  position?: number | null,
): string | null {
  if (!threadSlug || !position || position <= 0) return null;
  return `/forum/p/${threadSlug}/r/${position}`;
}
