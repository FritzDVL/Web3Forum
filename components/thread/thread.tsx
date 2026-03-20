"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { JoinCommunityAnnouncement } from "@/components/thread/join-community-announcement";
import { ThreadActions } from "@/components/thread/thread-actions";
import { ThreadCard } from "@/components/thread/thread-card";
import { ThreadRepliesList } from "@/components/thread/thread-replies-list";
import { ThreadSidebar } from "@/components/thread/thread-sidebar";
import { useCommunityMembership } from "@/hooks/communities/use-community-membership";
import { useJoinCommunity } from "@/hooks/communities/use-join-community";
import { Community } from "@/lib/domain/communities/types";
import { Thread as ThreadType } from "@/lib/domain/threads/types";
import { useAuthStore } from "@/stores/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";

interface ThreadProps {
  community: Community;
  thread: ThreadType;
}

export function Thread({ community, thread }: ThreadProps) {
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  const { isMember, updateIsMember, isLoading } = useCommunityMembership(community.group.address);
  const { isLoggedIn } = useAuthStore();
  const join = useJoinCommunity(community);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleJoin = async () => {
    setIsJoinLoading(true);
    const status = await join();
    if (status) {
      updateIsMember(true);
      queryClient.invalidateQueries({ queryKey: ["thread-replies", thread.id] });
      router.refresh();
    }
    setIsJoinLoading(false);
  };

  const needsApproval = community.group.membershipApprovalEnabled;
  const showContent = isMember || isLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ThreadActions thread={thread} />
          {showContent ? (
            <>
              <ThreadCard thread={thread} community={community} />
              <ThreadRepliesList thread={thread} community={community} />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
              <Lock className="mx-auto mb-4 h-10 w-10 text-slate-400 dark:text-gray-500" />
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-gray-100">
                Members only
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-gray-400">
                {!isLoggedIn
                  ? "Sign in and join this community to view and participate in discussions."
                  : needsApproval
                    ? "This community requires admin approval. Request to join to access this content."
                    : "Join this community to view and participate in discussions."}
              </p>
              {isLoggedIn && (
                <JoinCommunityAnnouncement isLoading={isJoinLoading} onJoinCommunity={handleJoin} />
              )}
            </div>
          )}
        </div>
        <div className="hidden lg:block lg:pt-[54px]">
          <ThreadSidebar community={community} />
        </div>
      </div>
    </div>
  );
}
