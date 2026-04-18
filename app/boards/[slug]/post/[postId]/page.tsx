import { getBoardPost } from "@/lib/services/board/get-board-post";
import { getBoardPostReplies } from "@/lib/services/board/get-board-post-replies";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardPostDetail } from "@/components/boards/board-post-detail";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;

  const postResult = await getBoardPost(postId);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Post not found" message={postResult.error || "The requested post does not exist."} />
        </div>
      </div>
    );
  }

  const repliesResult = await getBoardPostReplies(postResult.post.id);
  const replies = repliesResult.success ? (repliesResult.replies || []) : [];

  return <BoardPostDetail post={postResult.post} replies={replies} />;
}
