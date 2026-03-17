import Link from "next/link";
import { Lock } from "lucide-react";

interface ResearchSectionData {
  sectionTitle: string;
  categories: Array<{
    slug: string;
    name: string;
    description: string;
    publicationCount: number;
    viewsCount: number;
  }>;
}

interface ResearchCategoryListProps {
  section: ResearchSectionData;
}

export function ResearchCategoryList({ section }: ResearchCategoryListProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-yellow-600/50 bg-[#1a1b4b]">
      <div className="border-l-4 border-blue-600 bg-[#252663] px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-100">
            {section.sectionTitle}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-slate-600/50">
        {section.categories.map((cat) => (
          <Link
            key={cat.slug}
            href="/research"
            className="block transition-colors hover:bg-[#252663]"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-yellow-400">{cat.name}</h4>
                <p className="mt-1 text-xs text-slate-300">{cat.description}</p>
              </div>
              <div className="ml-4 hidden items-center gap-8 md:flex">
                <div className="min-w-[60px] text-center">
                  <div className="text-xs text-slate-400">Topics</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {cat.publicationCount.toLocaleString()}
                  </div>
                </div>
                <div className="min-w-[60px] text-center">
                  <div className="text-xs text-slate-400">Views</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {cat.viewsCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
