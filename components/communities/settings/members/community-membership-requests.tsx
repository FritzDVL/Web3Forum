import React from "react";
import Image from "next/image";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { useCommunityMembershipManagement } from "@/hooks/communities/use-community-membership-management";
import { Community } from "@/lib/domain/communities/types";
import { Check, Clock, X } from "lucide-react";

interface CommunityMembershipRequestsProps {
  community: Community;
}

export function CommunityMembershipRequests({ community }: CommunityMembershipRequestsProps) {
  const { requests, loading, error, pageInfo, fetchRequests, handleApprove, handleReject } =
    useCommunityMembershipManagement(community);

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          Membership Requests
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            {requests.length} pending
          </span>
        </h2>
      </div>

      {loading && <div className="text-center text-muted-foreground">Loading requests…</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center text-muted-foreground">No membership requests found.</div>
      )}

      {requests.length > 0 && (
        <div className="space-y-4">
          {requests.map(request => {
            const { account, requestedAt } = request;
            const avatarUrl = account.metadata?.picture || "/logo.png";
            const username = account.username?.localName || account.username?.value || "Unknown";
            const name = account.metadata?.name || username;

            return (
              <div
                key={request.account.address}
                className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <Image
                  src={avatarUrl}
                  alt={username}
                  className="h-12 w-12 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                  width={48}
                  height={48}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="truncate text-base font-semibold text-foreground">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">@{username}</span>
                  </div>
                  <div className="mt-1 break-all font-mono text-xs text-gray-500">{account.address}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Requested: {new Date(requestedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(account)}
                    // disabled={processingAccount === account}
                    className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(account)}
                    // disabled={processingAccount === account}
                    className="gap-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        hasPrev={!!(pageInfo && pageInfo.prev)}
        hasNext={!!(pageInfo && pageInfo.next)}
        loading={loading}
        onPrev={pageInfo && pageInfo.prev ? () => fetchRequests(pageInfo.prev) : undefined}
        onNext={pageInfo && pageInfo.next ? () => fetchRequests(pageInfo.next) : undefined}
      />
    </div>
  );
}
