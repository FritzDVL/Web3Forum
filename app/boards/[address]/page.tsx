import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPosts } from "@/lib/services/board/get-board-posts";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardNavActions } from "@/components/boards/board-nav-actions";
import { BoardPostList } from "@/components/boards/board-post-list";
import { Lock } from "lucide-react";

export default async function BoardPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

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

  const board = boardResult.board;
  const postsResult = await getBoardPosts(board, { limit: 10 });
  const posts = postsResult.success ? (postsResult.posts || []) : [];
  const nextCursor = postsResult.success ? (postsResult.nextCursor ?? null) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BoardNavActions feedAddress={address} isLocked={board.isLocked} />

      {/* Board Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {board.isLocked && <Lock className="h-5 w-5 flex-shrink-0 text-yellow-500" />}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">{board.name}</h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{board.description}</p>
        {board.isLocked && (
          <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
            🔒 This board requires a Society Protocol Pass to post. Read access is public.
          </p>
        )}
      </div>

      <BoardPostList
        boardId={board.id}
        feedAddress={address}
        initialPosts={posts}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
