import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { StatusBanner } from "@/components/shared/status-banner";
import { CreatePostForm } from "@/components/commons/create-post-form";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewPostPage({ params }: { params: Promise<{ address: string }> }) {
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
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}`}>
            <Button variant="outline" size="sm">
              ← Back to {feed.title}
            </Button>
          </Link>
        </div>

        <CreatePostForm 
          feedId={feed.id} 
          feedAddress={address} 
          feedTitle={feed.title}
        />
      </div>
    </ProtectedRoute>
  );
}
