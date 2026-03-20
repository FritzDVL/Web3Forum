"use client";

import { Community } from "@/lib/domain/communities/types";
import { useCommunityMembership } from "@/hooks/communities/use-community-membership";
import { useAuthStore } from "@/stores/auth-store";
import { ShieldCheck, LogIn } from "lucide-react";

interface MembershipBannerProps {
  community: Community;
}

export function MembershipBanner({ community }: MembershipBannerProps) {
  const { isMember, isLoading } = useCommunityMembership(community.group.address);
  const { isLoggedIn } = useAuthStore();

  if (isLoading || isMember) return null;

  const needsApproval = community.group.membershipApprovalEnabled;

  if (!isLoggedIn) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/20">
        <LogIn className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Sign in to participate in this community
          </p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            {needsApproval
              ? "This community requires admin approval to join. Sign in to request access."
              : "Connect your wallet and sign in to join and start posting."}
          </p>
        </div>
      </div>
    );
  }

  if (needsApproval) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 dark:border-rose-800/40 dark:bg-rose-900/20">
        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
        <div>
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
            This community requires approval to join
          </p>
          <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">
            Click &quot;Request to join&quot; above and an admin will review your request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800/40 dark:bg-blue-900/20">
      <LogIn className="h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
      <div>
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          You&apos;re not a member yet
        </p>
        <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
          Click &quot;Join community&quot; above to start participating.
        </p>
      </div>
    </div>
  );
}
