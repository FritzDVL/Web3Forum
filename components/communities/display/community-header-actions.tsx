"use client";

import { useEffect, useState } from "react";
import { LeaveCommunityDialog } from "@/components/communities/display/community-leave-dialog";
import { JoinCommunityButton } from "@/components/communities/display/join-community-button";
import { LeaveCommunityButton } from "@/components/communities/display/leave-community-button";
import { NewThreadButton } from "@/components/communities/display/new-thread-button";
import { Community } from "@/lib/domain/communities/types";
import { getCommunity } from "@/lib/services/community/get-community";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { useSessionClient } from "@lens-protocol/react";

interface CommunityHeaderActionsProps {
  communityAddr: Address;
}

export function CommunityHeaderActions({ communityAddr }: CommunityHeaderActionsProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();

  const refetchCommunity = async () => {
    if (sessionClient.loading) {
      return;
    }
    try {
      const community = await getCommunity(communityAddr, sessionClient.data);
      if (community.success && community.community) {
        setCommunity(community.community);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  useEffect(() => {
    refetchCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityAddr, sessionClient.data, sessionClient.loading]);

  const handleDialogOpen = (open: boolean) => setShowLeaveDialog(open);

  if (!community) {
    return null;
  }

  return (
    <div className="mt-0 flex w-full flex-row items-center justify-between gap-2 md:mt-2">
      <div className="flex flex-row items-center gap-1.5">
        <NewThreadButton community={community} />
      </div>
      <div className="flex flex-row items-center gap-1.5">
        <JoinCommunityButton community={community} onStatusChange={refetchCommunity} />
        <LeaveCommunityButton community={community} onDialogOpen={handleDialogOpen} />
      </div>
      <LeaveCommunityDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        community={community}
        onStatusChange={refetchCommunity}
      />
    </div>
  );
}
