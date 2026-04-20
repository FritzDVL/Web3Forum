import { isMainnet } from "@/lib/env";

/**
 * URL on a public Lens client where the user can view a post as a
 * standalone article (the "wrapped" version). Hey is the most stable
 * client for Lens v3 right now.
 *
 * Returns null if we don't have a postId.
 */
export function getLensPostUrl(lensPostId?: string | null): string | null {
  if (!lensPostId) return null;
  // Hey supports Lens v3 mainnet posts.
  // For testnet there is no equivalent client UI yet; we still link to
  // Hey so the user has *something* to click — Hey will simply 404 for
  // testnet posts, which is acceptable while testing.
  return `https://hey.xyz/posts/${lensPostId}`;
}

/** Public Grove gateway URL for a `lens://...` content URI (the raw metadata JSON). */
export function getGroveUrl(contentUri?: string | null): string | null {
  if (!contentUri) return null;
  if (contentUri.startsWith("lens://")) {
    return `https://api.grove.storage/${contentUri.slice("lens://".length)}`;
  }
  if (contentUri.startsWith("https://") || contentUri.startsWith("http://")) {
    return contentUri;
  }
  return null;
}

export function isLensMainnet(): boolean {
  return isMainnet();
}
