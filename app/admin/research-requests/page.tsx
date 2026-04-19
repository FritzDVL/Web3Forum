"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/hooks/admin/use-is-admin";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import {
  approveLensGroupMembershipRequests,
  fetchLensGroupMembershipRequests,
  rejectLensGroupMembershipRequests,
  type PendingMembershipRequest,
} from "@/lib/external/lens/primitives/groups";
import { RESEARCH_GROUP_ADDRESS } from "@/lib/shared/constants";

export default function ResearchRequestsPage() {
  const isAdmin = useIsAdmin();
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const [requests, setRequests] = useState<PendingMembershipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAddress, setBusyAddress] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionClient.data) return;
    setLoading(true);
    try {
      const r = await fetchLensGroupMembershipRequests(
        RESEARCH_GROUP_ADDRESS,
        sessionClient.data,
      );
      if (r.success && r.requests) {
        setRequests(r.requests);
      } else if (!r.success) {
        toast.error("Could not load requests", { description: r.error });
      }
    } finally {
      setLoading(false);
    }
  }, [sessionClient.data]);

  useEffect(() => {
    if (isAdmin && sessionClient.data) {
      load();
    }
  }, [isAdmin, sessionClient.data, load]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Admin · Research Requests</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Please sign in with your admin wallet to continue.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-2 text-red-600">
          <ShieldAlert className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Forbidden</h1>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          This page is only available to the admin wallet.
        </p>
      </div>
    );
  }

  async function handleApprove(address: string) {
    if (!sessionClient.data || !walletClient.data) return;
    setBusyAddress(address);
    const t = toast.loading("Approving…");
    try {
      const r = await approveLensGroupMembershipRequests(
        RESEARCH_GROUP_ADDRESS,
        [address],
        sessionClient.data,
        walletClient.data,
      );
      if (r.success) {
        toast.success("Approved ✓", { id: t });
        setRequests((prev) => prev.filter((x) => x.account !== address));
      } else {
        toast.error("Approve failed", { description: r.error, id: t });
      }
    } finally {
      setBusyAddress(null);
    }
  }

  async function handleReject(address: string) {
    if (!sessionClient.data || !walletClient.data) return;
    setBusyAddress(address);
    const t = toast.loading("Rejecting…");
    try {
      const r = await rejectLensGroupMembershipRequests(
        RESEARCH_GROUP_ADDRESS,
        [address],
        sessionClient.data,
        walletClient.data,
      );
      if (r.success) {
        toast.success("Rejected ✓", { id: t });
        setRequests((prev) => prev.filter((x) => x.account !== address));
      } else {
        toast.error("Reject failed", { description: r.error, id: t });
      }
    } finally {
      setBusyAddress(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/group-rules">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <h1 className="text-2xl font-bold">Research · Pending Membership Requests</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Approve or reject each request. Each action signs one transaction.
      </p>

      <div className="mt-6 space-y-3">
        {loading && requests.length === 0 && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}
        {!loading && requests.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
            No pending requests right now.
          </p>
        )}
        {requests.map((req) => {
          const busy = busyAddress === req.account;
          return (
            <div
              key={req.account}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {req.displayName || req.username || "Anonymous"}
                  {req.username && (
                    <span className="ml-2 text-sm text-gray-500">
                      @{req.username}
                    </span>
                  )}
                </div>
                <div className="mt-1 break-all font-mono text-xs text-gray-500">
                  {req.account}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Requested {new Date(req.requestedAt).toLocaleString()}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleReject(req.account)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => handleApprove(req.account)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
