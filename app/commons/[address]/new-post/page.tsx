import { getBoard } from "@/lib/services/board/get-board";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardPostCreateForm } from "@/components/boards/board-post-create-form";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewPostPage({ params }: { params: Promise<{ address: string }> }) {
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

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}`}>
            <Button variant="outline" size="sm">← Back to {boardResult.board.name}</Button>
          </Link>
        </div>
        <BoardPostCreateForm board={boardResult.board} />
      </div>
    </ProtectedRoute>
  );
}
