import { CommunityLinks } from "@/components/home/community-links";
import { ForumCategory } from "@/components/home/forum-category";
import { FunctionGrid } from "@/components/home/function-grid";
import { getBoardSections, getPartnerSection } from "@/lib/services/board/get-boards";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLocalCommunities() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data } = await supabase
    .from("communities")
    .select("id, name, lens_group_address, members_count")
    .eq("visible", true)
    .order("members_count", { ascending: false })
    .limit(9);

  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    lensGroupAddress: c.lens_group_address,
    membersCount: c.members_count,
  }));
}

export default async function HomePage() {
  const [boardSections, partnerSection, communities] = await Promise.all([
    getBoardSections(),
    getPartnerSection(),
    getLocalCommunities(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-12">
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

        {partnerSection && (
          <div className="w-full max-w-5xl">
            <ForumCategory
              title={partnerSection.sectionTitle}
              feeds={partnerSection.feeds}
              borderColor={partnerSection.borderColor}
              isLocked={partnerSection.isLocked}
            />
          </div>
        )}

        <div className="w-full max-w-5xl">
          <h2 className="mb-4 text-left text-xl font-bold text-slate-900 dark:text-gray-100">
            LOCAL
          </h2>
          <CommunityLinks communities={communities} />
        </div>
      </div>
    </div>
  );
}
