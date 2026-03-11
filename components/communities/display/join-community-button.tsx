import { Button } from "@/components/ui/button";
import { useJoinCommunity } from "@/hooks/communities/use-join-community";
import { Community } from "@/lib/domain/communities/types";
import { useAuthStore } from "@/stores/auth-store";
import { LogIn, ShieldX } from "lucide-react";

interface JoinCommunityButtonProps {
  community: Community;
  onStatusChange: () => void;
}

export function JoinCommunityButton({ community, onStatusChange }: JoinCommunityButtonProps) {
  const { isLoggedIn } = useAuthStore();

  const joinCommunity = useJoinCommunity(community);
  const requestJoin = useJoinCommunity(community);

  console.log("🔍 [JoinCommunityButton] Render:", {
    communityName: community.name,
    isLoggedIn,
    canJoin: community.group.operations?.canJoin.__typename,
    isBanned: community.group.operations?.isBanned,
    needsApproval: community.group.membershipApprovalEnabled
  });

  const handleJoinRequest = async () => {
    console.log("🚀 [JoinCommunityButton] Request join clicked");
    try {
      await requestJoin();
      console.log("✅ [JoinCommunityButton] Request join successful");
    } catch (error) {
      console.error("❌ [JoinCommunityButton] Request join error:", error);
    }
  };

  const handleJoin = async () => {
    console.log("🚀 [JoinCommunityButton] Join clicked");
    try {
      const joined = await joinCommunity();
      console.log("📊 [JoinCommunityButton] Join result:", joined);
      if (joined) {
        console.log("✅ [JoinCommunityButton] Join successful, calling onStatusChange");
        onStatusChange();
      } else {
        console.log("⚠️ [JoinCommunityButton] Join returned false");
      }
    } catch (error) {
      console.error("❌ [JoinCommunityButton] Join error:", error);
    }
  };

  const operations = community.group.operations;
  
  // If no operations (unauthenticated), show disabled join button
  if (!operations) {
    return (
      <Button
        disabled={true}
        size="sm"
        variant="default"
        className="h-8 px-3 text-xs font-medium transition-all duration-150"
      >
        <LogIn className="mr-1.5 h-3 w-3" />
        <span className="hidden md:inline">Join</span>
        <span className="md:hidden">Join</span>
      </Button>
    );
  }

  if (operations.isBanned) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
        <ShieldX className="h-4 w-4 flex-shrink-0" />
        <span className="hidden md:inline">Banned from community</span>
        <span className="md:hidden">Banned</span>
      </div>
    );
  }
  const canJoin = operations.canJoin.__typename === "GroupOperationValidationPassed" && !operations.isBanned;
  const needsMembershipApproval = community.group.membershipApprovalEnabled;

  if (!canJoin) {
    return null;
  }

  if (needsMembershipApproval) {
    return (
      <Button
        disabled={!isLoggedIn}
        onClick={handleJoinRequest}
        size="sm"
        variant="default"
        className="h-8 px-3 text-xs font-medium transition-all duration-150"
      >
        <LogIn className="mr-1.5 h-3 w-3" />
        <span className="hidden md:inline">Request join</span>
      </Button>
    );
  }

  return (
    <Button
      disabled={!isLoggedIn}
      onClick={handleJoin}
      size="sm"
      variant="default"
      className="h-8 px-3 text-xs font-medium transition-all duration-150"
    >
      <LogIn className="mr-1.5 h-3 w-3" />
      <span className="hidden md:inline">Join</span>
      <span className="md:hidden">Join</span>
    </Button>
  );
}
