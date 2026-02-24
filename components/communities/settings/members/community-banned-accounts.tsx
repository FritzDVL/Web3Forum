import React, { useState } from "react";
import Image from "next/image";
import { CommunityMemberCard } from "@/components/communities/settings/members/community-user-card";
import { UnbanMemberDialog } from "@/components/communities/settings/members/unban-member-dialog";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCommunityBannedMembers } from "@/hooks/communities/use-community-banned-members";
import { useCommunityUnbanMember } from "@/hooks/communities/use-community-unban-member";
import { Community } from "@/lib/domain/communities/types";
import { GroupBannedAccount } from "@lens-protocol/client";
import { UserCheck } from "lucide-react";

interface CommunityBannedAccountsProps {
  community: Community;
}

function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("default", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function CommunityBannedAccounts({ community }: CommunityBannedAccountsProps) {
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GroupBannedAccount | null>(null);

  const { unbanMember, isLoading } = useCommunityUnbanMember();
  const {
    banned,
    bannedLoading,
    removeBannedFromList,
    hasNext: bannedHasNext,
    hasPrev: bannedHasPrev,
    next: bannedNext,
    previous: bannedPrevious,
  } = useCommunityBannedMembers(community);

  const handleUnbanClick = (account: GroupBannedAccount) => {
    setSelectedAccount(account);
    setShowUnbanDialog(true);
  };

  const handleConfirmUnban = async () => {
    if (!selectedAccount) return;

    const success = await unbanMember(community.group.address, selectedAccount);
    if (success) {
      removeBannedFromList(selectedAccount);
    }
    setShowUnbanDialog(false);
    setSelectedAccount(null);
  };

  if (bannedLoading) {
    return <LoadingSpinner text="Loading banned accounts..." />;
  }

  if (banned.length === 0) {
    return <div className="text-center text-muted-foreground">No banned accounts found.</div>;
  }

  return (
    <div className="py-6">
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {banned.map(ban => {
          const { account, bannedAt, bannedBy } = ban;
          const avatarUrl = account.metadata?.picture || "/logo.png";
          const username = account.username?.localName || account.username?.value || "Unknown";
          const name = account.metadata?.name || username;
          return (
            <CommunityMemberCard
              key={account.address}
              avatarUrl={avatarUrl}
              name={name}
              username={username}
              actionButton={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                  disabled={isLoading}
                  onClick={() => handleUnbanClick(ban)}
                >
                  <UserCheck className="mr-1 h-4 w-4 text-blue-500" />
                  Unban
                </button>
              }
              meta={
                <>
                  Banned: {formatDate(bannedAt)} by{" "}
                  {bannedBy?.username?.localName || bannedBy?.username?.value || bannedBy?.address}
                </>
              }
            />
          );
        })}
      </ul>
      <Pagination
        hasPrev={bannedHasPrev}
        hasNext={bannedHasNext}
        loading={bannedLoading}
        onPrev={bannedPrevious}
        onNext={bannedNext}
      />

      <UnbanMemberDialog
        open={showUnbanDialog}
        onOpenChange={setShowUnbanDialog}
        selectedAccount={selectedAccount}
        onConfirm={handleConfirmUnban}
        isLoading={isLoading}
      />
    </div>
  );
}
