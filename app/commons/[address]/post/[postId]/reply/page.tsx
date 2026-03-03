import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { getFeedPost } from "@/lib/services/feed/get-feed-post";
import { StatusBanner } from "@/components/shared/status-banner";
import { CreateReplyForm } from "@/components/commons/create-reply-form";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewReplyPage({ 
  params 
}: { 
  params: Promise<{ address: string; postId: string }> 
}) {
  const { address, postId } = await params;
  
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

  const postResult = await getFeedPost(feed.id, address, postId);

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
  
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}/post/${postId}`}>
            <Button variant="outline" size="sm">
              ← Back to post
            </Button>
          </Link>
        </div>

        <CreateReplyForm 
          feedId={feed.id} 
          feedAddress={address}
          parentPostId={postId}
          parentPostTitle={postResult.post.title}
        />
      </div>
    </ProtectedRoute>
  );
}
