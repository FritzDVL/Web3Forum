"use client";

import { ExternalLink } from "lucide-react";
import { PublishStatus } from "@/lib/domain/forum/types";
import { getLensPostUrl } from "@/lib/shared/lens-urls";

interface PublishStatusBadgeProps {
  status: PublishStatus;
  lensPostId?: string | null;
  contentUri?: string | null;
  onRetry?: () => void;
}

export function PublishStatusBadge({ status, lensPostId, contentUri, onRetry }: PublishStatusBadgeProps) {
  if (status === "confirmed") {
    const lensUrl = getLensPostUrl(lensPostId);
    const inner = (
      <>
        ✓ On-chain
        {lensUrl && <ExternalLink className="h-3 w-3" />}
      </>
    );
    const className =
      "inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (lensUrl) {
      return (
        <a
          href={lensUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} hover:underline`}
          title={`View on Lens: ${lensPostId}`}
        >
          {inner}
        </a>
      );
    }
    return (
      <span className={className} title={contentUri || undefined}>
        {inner}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Publishing...
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        ⚠️ Off-chain
        {onRetry && (
          <button onClick={onRetry} className="ml-1 underline hover:no-underline">
            Retry
          </button>
        )}
      </span>
    );
  }

  return null;
}
