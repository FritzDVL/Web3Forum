import { ExternalLink } from "lucide-react";
import { groveUriToHttpUrl } from "@/lib/external/grove/fetch-metadata";
import { PublishStatus } from "@/lib/domain/forum/types";

interface Props {
  publishStatus: PublishStatus;
  lensPostId: string | null;
  contentUri: string | null;
  source: "grove" | "supabase";
}

export function ArticleOnchainPanel({
  publishStatus,
  lensPostId,
  contentUri,
  source,
}: Props) {
  const groveUrl = groveUriToHttpUrl(contentUri || "");

  return (
    <aside className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs dark:border-gray-700 dark:bg-gray-800/50">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-gray-200">
        On-chain record
      </h3>
      <dl className="space-y-1.5 text-slate-600 dark:text-gray-400">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium">Status:</dt>
          <dd>
            {publishStatus === "confirmed"
              ? "✓ Published on Lens"
              : publishStatus === "pending"
                ? "Publishing…"
                : "⚠️ Off-chain only"}
          </dd>
        </div>

        {lensPostId && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">Lens post ID:</dt>
            <dd>
              <code className="break-all rounded bg-white px-1 py-0.5 dark:bg-gray-900">
                {lensPostId}
              </code>
            </dd>
          </div>
        )}

        {contentUri && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">Content URI:</dt>
            <dd>
              <code className="break-all rounded bg-white px-1 py-0.5 dark:bg-gray-900">
                {contentUri}
              </code>
            </dd>
          </div>
        )}

        {groveUrl && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">Grove:</dt>
            <dd>
              <a
                href={groveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
              >
                Raw metadata JSON
                <ExternalLink className="h-3 w-3" />
              </a>
            </dd>
          </div>
        )}

        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium">Rendered from:</dt>
          <dd>{source === "grove" ? "Lens / Grove" : "Local cache"}</dd>
        </div>
      </dl>
    </aside>
  );
}
