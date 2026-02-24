import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Community } from "@/lib/domain/communities/types";
import { PenTool } from "lucide-react";

export function NewThreadButton({ community }: { community: Community }) {
  const router = useRouter();

  const canPost = community.group.feed?.operations?.canPost.__typename === "FeedOperationValidationPassed";
  if (!canPost) return null;

  return (
    <Button
      onClick={() => {
        router.push(`/communities/${community.group.address}/new-thread`);
      }}
      variant="default"
      size="sm"
      className="h-8 bg-blue-600 px-3 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow-md"
    >
      <PenTool className="mr-1.5 h-3 w-3" />
      <span className="hidden md:inline">New Thread</span>
      <span className="md:hidden">New</span>
    </Button>
  );
}
