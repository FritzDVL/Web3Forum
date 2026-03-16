import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPost } from "@/lib/services/board/get-board-post";
import { getBoardPostReplies } from "@/lib/services/board/get-board-post-replies";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardPostDetail } from "@/components/boards/board-post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ address: string; postId: string }>;
}) {
  const { address, postId } = await params;

  const boardResult = await getBoard(address);

  if (!boardResult.success || !boardResult.board) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="info" title="Board not found" message="The requested board does not exist." />
        </div>
      </div>
    );
  }

  const [postResult, repliesResult] = await Promise.all([
    getBoardPost(boardResult.board, postId),
    getBoardPostReplies(postId),
  ]);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Post not found" message={postResult.error || "The requested post does not exist."} />
        </div>
      </div>
    );
  }

  const replies = repliesResult.success ? (repliesResult.replies || []) : [];

  return <BoardPostDetail post={postResult.post} replies={replies} />;
}
