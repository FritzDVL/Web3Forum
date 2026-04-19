"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Unlock, Lock, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/hooks/admin/use-is-admin";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import {
  disableMembershipApproval,
  enableMembershipApproval,
  fetchGroupRules,
  removeAllGroupRules,
  type GroupRuleSummary,
} from "@/lib/external/lens/primitives/groups";
import {
  COMMONS_GROUP_ADDRESS,
  RESEARCH_GROUP_ADDRESS,
} from "@/lib/shared/constants";

type RulesState = {
  loading: boolean;
  rules?: GroupRuleSummary[];
  error?: string;
};

function RulesList({ state }: { state: RulesState }) {
  if (state.loading) {
    return <p className="mt-2 text-xs text-gray-500">Loading current rules…</p>;
  }
  if (state.error) {
    return (
      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
        Failed to read rules: {state.error}
      </p>
    );
  }
  if (!state.rules || state.rules.length === 0) {
    return (
      <p className="mt-2 text-xs text-green-700 dark:text-green-400">
        ✓ No active rules — group is fully open.
      </p>
    );
  }
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Current rules ({state.rules.length}):
      </p>
      <ul className="mt-1 space-y-1">
        {state.rules.map((r) => (
          <li
            key={r.id}
            className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <span className="font-mono">{r.type}</span>
            <span className="ml-2 text-gray-500">({r.scope})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GroupRulesAdminPage() {
  const isAdmin = useIsAdmin();
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const [busy, setBusy] = useState<string | null>(null);

  const [commonsState, setCommonsState] = useState<RulesState>({ loading: true });
  const [researchState, setResearchState] = useState<RulesState>({ loading: true });

  const refreshRules = useCallback(async () => {
    if (!sessionClient.data) return;
    setCommonsState({ loading: true });
    setResearchState({ loading: true });
    const [c, r] = await Promise.all([
      fetchGroupRules(COMMONS_GROUP_ADDRESS, sessionClient.data),
      fetchGroupRules(RESEARCH_GROUP_ADDRESS, sessionClient.data),
    ]);
    setCommonsState({
      loading: false,
      rules: c.rules,
      error: c.success ? undefined : c.error,
    });
    setResearchState({
      loading: false,
      rules: r.rules,
      error: r.success ? undefined : r.error,
    });
  }, [sessionClient.data]);

  useEffect(() => {
    if (sessionClient.data && isAdmin) {
      void refreshRules();
    }
  }, [sessionClient.data, isAdmin, refreshRules]);

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
        await refreshRules();
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Group Rules</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshRules}
          disabled={busy !== null}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Each action signs one transaction with your admin wallet. The current
        rule list is shown for each group so you can see exactly what's blocking
        joins.
      </p>

      <div className="mt-8 space-y-6">
        {/* Commons → open */}
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Unlock className="h-4 w-4" />
            Society-Commons — open to everyone
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Any signed-in user should be able to click "Join Society-Commons"
            and post in one step.
          </p>
          <p className="mt-1 break-all text-xs text-gray-400">
            {COMMONS_GROUP_ADDRESS}
          </p>

          <RulesList state={commonsState} />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={busy !== null}
              onClick={() =>
                run("Open Commons (remove approval rule)", () =>
                  disableMembershipApproval(
                    COMMONS_GROUP_ADDRESS,
                    sessionClient.data!,
                    walletClient.data!,
                  ),
                )
              }
            >
              {busy === "Open Commons (remove approval rule)"
                ? "Working…"
                : "Remove approval rule only"}
            </Button>
            <Button
              variant="destructive"
              disabled={busy !== null}
              onClick={() =>
                run("Force-open Commons (remove ALL rules)", () =>
                  removeAllGroupRules(
                    COMMONS_GROUP_ADDRESS,
                    sessionClient.data!,
                    walletClient.data!,
                  ),
                )
              }
            >
              {busy === "Force-open Commons (remove ALL rules)"
                ? "Working…"
                : "Force open (remove ALL rules)"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            If "Remove approval rule only" doesn't work and there are still
            rules listed above, use "Force open" to strip them all.
          </p>
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

          <RulesList state={researchState} />

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
