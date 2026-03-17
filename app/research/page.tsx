import { getResearchThreads } from "@/lib/services/research/get-research-threads";
import { getResearchCategories } from "@/lib/services/research/get-research-categories";
import { fetchAllResearchTags } from "@/lib/external/supabase/research-publications";
import { ResearchThreadList } from "@/components/research/research-thread-list";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const [threadsResult, categoriesResult, allTags] = await Promise.all([
    getResearchThreads({ limit: 20 }),
    getResearchCategories(),
    fetchAllResearchTags(),
  ]);

  const threads = threadsResult.success ? (threadsResult.threads || []) : [];
  const categories = categoriesResult.success ? (categoriesResult.categories || []) : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
          Society Protocol Research
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Technical research and discussion
        </p>
      </div>

      <ResearchThreadList
        initialThreads={threads}
        categories={categories}
        allTags={allTags}
      />
    </div>
  );
}
