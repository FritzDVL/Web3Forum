import { CommunityGrid } from "@/components/home/community-grid";
import { getFeaturedCommunities } from "@/lib/services/community/get-featured-communities";

export default async function HomePage() {
  const featuredCommunitiesResult = await getFeaturedCommunities();
  const featuredCommunities = featuredCommunitiesResult.success ? (featuredCommunitiesResult.communities ?? []) : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center">
        <h2 className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-gray-100">
          Featured Communities
        </h2>
        <div className="w-full max-w-5xl">
          <CommunityGrid communities={featuredCommunities} />
        </div>
      </div>
    </div>
  );
}
