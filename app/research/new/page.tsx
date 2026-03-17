import { getResearchCategories } from "@/lib/services/research/get-research-categories";
import { ResearchTopicCreateForm } from "@/components/research/research-topic-create-form";
import { ResearchNavActions } from "@/components/research/research-nav-actions";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { StatusBanner } from "@/components/shared/status-banner";

export default async function NewResearchTopicPage() {
  const categoriesResult = await getResearchCategories();

  if (!categoriesResult.success || !categoriesResult.categories?.length) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Error" message="Failed to load categories." />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ResearchNavActions backHref="/research" backLabel="Back to Research" showNewTopic={false} />
        <ResearchTopicCreateForm categories={categoriesResult.categories} />
      </div>
    </ProtectedRoute>
  );
}
