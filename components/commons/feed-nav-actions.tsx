import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface FeedNavActionsProps {
  feedAddress: string;
  isLocked?: boolean;
}

export function FeedNavActions({ feedAddress, isLocked = false }: FeedNavActionsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
      
      <Link href={`/commons/${feedAddress}/new-post`}>
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
