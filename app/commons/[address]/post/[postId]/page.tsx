import { getFeedPost } from "@/lib/services/feed/get-feed-post";
import { getFeedReplies } from "@/lib/services/feed/get-feed-replies";
import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { StatusBanner } from "@/components/shared/status-banner";
import { PostDetail } from "@/components/commons/post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ address: string; postId: string }>;
}) {
  const { address, postId } = await params;

  // Fetch feed metadata
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

  // Fetch post and replies in parallel
  const [postResult, repliesResult] = await Promise.all([
    getFeedPost(feed.id, address, postId),
    getFeedReplies(postId),
  ]);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="error"
            title="Post not found"
            message={postResult.error || "The requested post does not exist."}
          />
        </div>
      </div>
    );
  }

  const replies = repliesResult.success ? repliesResult.replies || [] : [];

  return <PostDetail post={postResult.post} feedAddress={address} replies={replies} />;
}
