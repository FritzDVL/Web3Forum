import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface BoardNavActionsProps {
  boardSlug: string;
  isLocked?: boolean;
}

export function BoardNavActions({ boardSlug, isLocked = false }: BoardNavActionsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/">
        <Button variant="outline" size="sm">
          ← Back to Home
        </Button>
      </Link>
      <Link href={`/boards/${boardSlug}/new-post`}>
        <Button
          size="sm"
          className="gap-2"
          disabled={isLocked}
          title={isLocked ? "Requires Society Protocol Pass" : "Create new post"}
        >
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </Link>
    </div>
  );
}
