import { getResearchThread } from "@/lib/services/research/get-research-thread";
import { StatusBanner } from "@/components/shared/status-banner";
import { ResearchNavActions } from "@/components/research/research-nav-actions";
import { ResearchThreadView } from "@/components/research/research-thread-view";

export const dynamic = "force-dynamic";

export default async function ResearchThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const result = await getResearchThread(threadId);

  if (!result.success || !result.thread || !result.publications) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="error"
            title="Thread not found"
            message={result.error || "The requested thread does not exist."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ResearchNavActions backHref="/research" backLabel="Back to Research" showNewTopic={false} />
      <ResearchThreadView thread={result.thread} publications={result.publications} />
    </div>
  );
}
