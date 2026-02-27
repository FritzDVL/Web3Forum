import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { StatusBanner } from "@/components/shared/status-banner";
import { FeedNavActions } from "@/components/commons/feed-nav-actions";
import { FeedPostsList } from "@/components/commons/feed-posts-list";
import { Lock } from "lucide-react";

export default async function FeedPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  
  const feed = await fetchFeedByAddress(address);
  
  if (!feed) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="info"
            title="Feed not found"
            message="The requested feed does not exist."
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <FeedNavActions feedAddress={address} isLocked={feed.is_locked} />
      
      {/* Feed Header */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {feed.is_locked && (
            <Lock className="h-6 w-6 flex-shrink-0 text-yellow-500" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
              {feed.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {feed.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {feed.category}
              </span>
              <span>{feed.post_count || 0} posts</span>
            </div>
          </div>
        </div>
        
        {feed.is_locked && (
          <div className="mt-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              🔒 This feed requires a Society Protocol Pass to post. Read access is public.
            </p>
          </div>
        )}
      </div>

      {/* Feed Posts */}
      <FeedPostsList feedAddress={address} />
    </div>
  );
}
