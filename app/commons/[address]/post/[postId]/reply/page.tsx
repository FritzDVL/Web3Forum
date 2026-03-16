import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPost } from "@/lib/services/board/get-board-post";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardReplyBox } from "@/components/boards/board-reply-box";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Address } from "@/types/common";

export default async function NewReplyPage({
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

  const postResult = await getBoardPost(boardResult.board, postId);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Post not found" message={postResult.error || "The requested post does not exist."} />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}/post/${postId}`}>
            <Button variant="outline" size="sm">← Back to post</Button>
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-sm text-gray-500">
            Replying to <span className="font-medium text-slate-900 dark:text-gray-100">{postResult.post.title}</span>
          </div>
          <BoardReplyBox postId={postId} feedAddress={address as Address} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
