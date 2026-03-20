import { Button } from "@/components/ui/button";
import { useJoinCommunity } from "@/hooks/communities/use-join-community";
import { useRequestJoinCommunity } from "@/hooks/communities/use-request-join-community";
import { useCommunityMembership } from "@/hooks/communities/use-community-membership";
import { Community } from "@/lib/domain/communities/types";
import { useAuthStore } from "@/stores/auth-store";
import { LogIn, ShieldX } from "lucide-react";
import { useState } from "react";

interface JoinCommunityButtonProps {
  community: Community;
  onStatusChange: () => void;
}

export function JoinCommunityButton({ community, onStatusChange }: JoinCommunityButtonProps) {
  const { isLoggedIn } = useAuthStore();
  const { isMember, isLoading } = useCommunityMembership(community.group.address);
  const joinCommunity = useJoinCommunity(community);
  const requestJoin = useRequestJoinCommunity(community);
  const [requested, setRequested] = useState(false);

  const handleJoinRequest = async () => {
    const success = await requestJoin();
    if (success) setRequested(true);
  };

  const handleJoin = async () => {
    const joined = await joinCommunity();
    if (joined) onStatusChange();
  };

  const operations = community.group.operations;

  if (isMember && !isLoading) return null;

  if (operations?.isBanned) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
        <ShieldX className="h-4 w-4 flex-shrink-0" />
        Banned from community
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button disabled size="sm" variant="default" className="h-9 px-4 text-sm font-medium">
        <LogIn className="mr-2 h-4 w-4" />
        Sign in to join
      </Button>
    );
  }

  const needsMembershipApproval = community.group.membershipApprovalEnabled;

  if (needsMembershipApproval) {
    if (requested) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          ⏳ Request sent — waiting for admin approval
        </div>
      );
    }
    return (
      <Button
        onClick={handleJoinRequest}
        size="sm"
        variant="default"
        className="h-9 px-4 text-sm font-medium"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Request to join
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      size="sm"
      variant="default"
      className="h-9 px-4 text-sm font-medium"
    >
      <LogIn className="mr-2 h-4 w-4" />
      Join community
    </Button>
  );
}
