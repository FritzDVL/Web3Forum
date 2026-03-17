import { CommunityGrid } from "@/components/home/community-grid";
import { ForumCategory } from "@/components/home/forum-category";
import { FunctionGrid } from "@/components/home/function-grid";
import { ResearchCategoryList } from "@/components/home/research-category-list";
import { getFeaturedCommunities } from "@/lib/services/community/get-featured-communities";
import { getBoardSections, getResearchSection } from "@/lib/services/board/get-boards";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [boardSections, researchSection, featuredCommunitiesResult] = await Promise.all([
    getBoardSections(),
    getResearchSection(),
    getFeaturedCommunities(),
  ]);
  
  const featuredCommunities = featuredCommunitiesResult.success ? (featuredCommunitiesResult.communities ?? []) : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-12">
        {/* Board Sections (general, functions, others, partners — no technical) */}
        {boardSections.map((section) => (
          <div key={section.sectionTitle} className="w-full max-w-5xl">
            {section.layout === "grid" ? (
              <FunctionGrid 
                title={section.sectionTitle} 
                feeds={section.feeds}
                borderColor={section.borderColor}
              />
            ) : (
              <ForumCategory 
                title={section.sectionTitle} 
                feeds={section.feeds}
                borderColor={section.borderColor}
                isLocked={section.isLocked}
              />
            )}
          </div>
        ))}

        {/* Research Section (replaces technical boards) */}
        {researchSection && (
          <div className="w-full max-w-5xl">
            <ResearchCategoryList section={researchSection} />
          </div>
        )}

        {/* Featured Communities Section */}
        <div className="w-full max-w-5xl">
          <h2 className="mb-8 text-left text-xl font-bold text-slate-900 dark:text-gray-100">
            LOCAL
          </h2>
          <CommunityGrid communities={featuredCommunities} />
        </div>
      </div>
    </div>
  );
}
