"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Unlock, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/hooks/admin/use-is-admin";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import {
  disableMembershipApproval,
  enableMembershipApproval,
} from "@/lib/external/lens/primitives/groups";
import {
  COMMONS_GROUP_ADDRESS,
  RESEARCH_GROUP_ADDRESS,
} from "@/lib/shared/constants";

export default function GroupRulesAdminPage() {
  const isAdmin = useIsAdmin();
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const [busy, setBusy] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold">Admin · Group Rules</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Please sign in with your admin wallet to continue.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
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

  async function run(
    label: string,
    fn: () => Promise<{ success: boolean; error?: string }>,
  ) {
    if (!sessionClient.data || !walletClient.data) {
      toast.error("Wallet/session not ready");
      return;
    }
    setBusy(label);
    const t = toast.loading(`${label}…`);
    try {
      const r = await fn();
      if (r.success) {
        toast.success(`${label} ✓`, { id: t });
      } else {
        toast.error(`${label} failed`, { description: r.error, id: t });
      }
    } catch (err) {
      toast.error(`${label} failed`, {
        description: err instanceof Error ? err.message : String(err),
        id: t,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <h1 className="text-2xl font-bold">Admin · Group Rules</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        One-time setup. Each button signs one transaction with your admin wallet.
      </p>

      <div className="mt-8 space-y-6">
        {/* Commons → open */}
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Unlock className="h-4 w-4" />
            Society-Commons — open to everyone
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Removes the membership-approval rule from Commons so any signed-in
            user can join in one click and post.
          </p>
          <p className="mt-1 break-all text-xs text-gray-400">
            {COMMONS_GROUP_ADDRESS}
          </p>
          <Button
            className="mt-3"
            disabled={busy !== null}
            onClick={() =>
              run("Open Commons", () =>
                disableMembershipApproval(
                  COMMONS_GROUP_ADDRESS,
                  sessionClient.data!,
                  walletClient.data!,
                ),
              )
            }
          >
            {busy === "Open Commons" ? "Working…" : "Open Commons (remove approval)"}
          </Button>
        </section>

        {/* Research → gated */}
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="h-4 w-4" />
            Society-Research — admin approval required
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Adds the membership-approval rule. Users must request access; you
            approve them on the requests page.
          </p>
          <p className="mt-1 break-all text-xs text-gray-400">
            {RESEARCH_GROUP_ADDRESS}
          </p>
          <Button
            className="mt-3"
            disabled={busy !== null}
            onClick={() =>
              run("Gate Research", () =>
                enableMembershipApproval(
                  RESEARCH_GROUP_ADDRESS,
                  sessionClient.data!,
                  walletClient.data!,
                ),
              )
            }
          >
            {busy === "Gate Research" ? "Working…" : "Gate Research (require approval)"}
          </Button>
        </section>

        <div className="text-sm">
          <Link
            href="/admin/research-requests"
            className="text-blue-600 underline dark:text-blue-400"
          >
            Go to pending Research requests →
          </Link>
        </div>
      </div>
    </div>
  );
}
