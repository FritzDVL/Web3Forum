"use client";

import { useEffect, useState } from "react";
import { LeaveCommunityDialog } from "@/components/communities/display/community-leave-dialog";
import { JoinCommunityButton } from "@/components/communities/display/join-community-button";
import { LeaveCommunityButton } from "@/components/communities/display/leave-community-button";
import { NewThreadButton } from "@/components/communities/display/new-thread-button";
import { Community } from "@/lib/domain/communities/types";
import { getCommunity } from "@/lib/services/community/get-community";
import { useSessionClient } from "@lens-protocol/react";
import { Address } from "@/types/common";

interface CommunityHeaderActionsProps {
  communityAddr: Address;
  initialCommunity?: Community;
}

export function CommunityHeaderActions({ communityAddr, initialCommunity }: CommunityHeaderActionsProps) {
  const [community, setCommunity] = useState<Community | null>(initialCommunity ?? null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const sessionClient = useSessionClient();

  const refetchCommunity = async () => {
    if (sessionClient.loading) return;
    try {
      const result = await getCommunity(communityAddr, sessionClient.data);
      if (result.success && result.community) {
        setCommunity(result.community);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  useEffect(() => {
    refetchCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityAddr, sessionClient.data, sessionClient.loading]);

  if (!community) return null;

  return (
    <div className="mt-0 flex w-full flex-row items-center justify-between gap-2 md:mt-2">
      <div className="flex flex-row items-center gap-1.5">
        <NewThreadButton community={community} />
      </div>
      <div className="flex flex-row items-center gap-1.5">
        <JoinCommunityButton community={community} onStatusChange={refetchCommunity} />
        <LeaveCommunityButton community={community} onDialogOpen={(open) => setShowLeaveDialog(open)} />
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
