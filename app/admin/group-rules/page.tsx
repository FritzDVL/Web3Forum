"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Unlock, Lock, RefreshCw, Server, Wallet } from "lucide-react";
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
  ADMIN_USER_ADDRESS,
} from "@/lib/shared/constants";
import {
  buildAdminProofMessage,
  getServerAdminAddress,
  getGroupOnChainAdmins,
  serverDisableMembershipApproval,
  serverEnableMembershipApproval,
  serverRemoveAllGroupRules,
  type AdminProof,
} from "./actions";

type RulesState = {
  loading: boolean;
  rules?: GroupRuleSummary[];
  error?: string;
};

type AdminsState = {
  loading: boolean;
  admins?: string[];
  error?: string;
};

function shortAddr(a: string) {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

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

function AdminsList({
  state,
  serverAddr,
  metaMaskAddr,
}: {
  state: AdminsState;
  serverAddr: string | null;
  metaMaskAddr: string | null;
}) {
  if (state.loading) {
    return <p className="mt-1 text-xs text-gray-500">Loading on-chain admins…</p>;
  }
  if (state.error) {
    return (
      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
        Could not read on-chain admins: {state.error}
      </p>
    );
  }
  const admins = state.admins || [];
  return (
    <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold text-gray-700 dark:text-gray-300">
        On-chain admins ({admins.length}):
      </p>
      {admins.length === 0 ? (
        <p className="mt-1 text-gray-500">
          No additional admins. Group owner has sole control.
        </p>
      ) : (
        <ul className="mt-1 space-y-1">
          {admins.map((a) => {
            const isServer = serverAddr && a.toLowerCase() === serverAddr.toLowerCase();
            const isMM = metaMaskAddr && a.toLowerCase() === metaMaskAddr.toLowerCase();
            return (
              <li key={a} className="break-all font-mono">
                {a}
                {isServer && (
                  <span className="ml-2 rounded bg-blue-100 px-1 py-0.5 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    server (PRIVATE_KEY)
                  </span>
                )}
                {isMM && (
                  <span className="ml-2 rounded bg-purple-100 px-1 py-0.5 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                    your MetaMask
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function GroupRulesAdminPage() {
  const isAdmin = useIsAdmin();
  const { isLoggedIn, walletAddress } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const [busy, setBusy] = useState<string | null>(null);

  const [serverAddr, setServerAddr] = useState<string | null>(null);
  const [serverAddrError, setServerAddrError] = useState<string | null>(null);

  const [commonsState, setCommonsState] = useState<RulesState>({ loading: true });
  const [researchState, setResearchState] = useState<RulesState>({ loading: true });
  const [commonsAdmins, setCommonsAdmins] = useState<AdminsState>({ loading: true });
  const [researchAdmins, setResearchAdmins] = useState<AdminsState>({ loading: true });

  const refreshAll = useCallback(async () => {
    if (!sessionClient.data) return;
    setCommonsState({ loading: true });
    setResearchState({ loading: true });
    setCommonsAdmins({ loading: true });
    setResearchAdmins({ loading: true });

    const [c, r, cA, rA, sa] = await Promise.all([
      fetchGroupRules(COMMONS_GROUP_ADDRESS, sessionClient.data),
      fetchGroupRules(RESEARCH_GROUP_ADDRESS, sessionClient.data),
      getGroupOnChainAdmins(COMMONS_GROUP_ADDRESS),
      getGroupOnChainAdmins(RESEARCH_GROUP_ADDRESS),
      getServerAdminAddress(),
    ]);

    setCommonsState({ loading: false, rules: c.rules, error: c.success ? undefined : c.error });
    setResearchState({ loading: false, rules: r.rules, error: r.success ? undefined : r.error });
    setCommonsAdmins({ loading: false, admins: cA.admins, error: cA.success ? undefined : cA.error });
    setResearchAdmins({ loading: false, admins: rA.admins, error: rA.success ? undefined : rA.error });
    if (sa.success && sa.address) {
      setServerAddr(sa.address);
      setServerAddrError(null);
    } else {
      setServerAddr(null);
      setServerAddrError(sa.error || "PRIVATE_KEY not set");
    }
  }, [sessionClient.data]);

  useEffect(() => {
    if (sessionClient.data && isAdmin) {
      void refreshAll();
    }
  }, [sessionClient.data, isAdmin, refreshAll]);

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
    setBusy(label);
    const t = toast.loading(`${label}…`);
    try {
      const r = await fn();
      if (r.success) {
        toast.success(`${label} ✓`, { id: t });
        await refreshAll();
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

  // Sign a fresh admin proof so the server actions can verify the caller is
  // actually the admin wallet (not just anyone POSTing to the action).
  async function signAdminProof(): Promise<AdminProof> {
    if (!walletClient.data) {
      throw new Error("Wallet not connected.");
    }
    const message = await buildAdminProofMessage();
    const signature = await walletClient.data.signMessage({ message });
    return { message, signature };
  }

  async function runWithProof(
    label: string,
    fn: (proof: AdminProof) => Promise<{ success: boolean; error?: string }>,
  ) {
    setBusy(label);
    const t = toast.loading(`${label}: sign admin proof…`);
    try {
      const proof = await signAdminProof();
      toast.loading(`${label}: submitting…`, { id: t });
      const r = await fn(proof);
      if (r.success) {
        toast.success(`${label} ✓`, { id: t });
        await refreshAll();
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

  // Decide whether MetaMask actions are even attemptable
  const mmCommonsIsAdmin =
    !!walletAddress &&
    !!commonsAdmins.admins?.some(
      (a) => a.toLowerCase() === walletAddress.toLowerCase(),
    );
  const mmResearchIsAdmin =
    !!walletAddress &&
    !!researchAdmins.admins?.some(
      (a) => a.toLowerCase() === walletAddress.toLowerCase(),
    );

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
          onClick={refreshAll}
          disabled={busy !== null}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Wallet identity panel */}
      <section className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs dark:border-blue-900 dark:bg-blue-950">
        <p className="font-semibold text-blue-900 dark:text-blue-200">
          Wallet identity check
        </p>
        <ul className="mt-2 space-y-1">
          <li className="flex items-start gap-2">
            <Wallet className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <div className="break-all">
              <span className="font-semibold">Your MetaMask: </span>
              <span className="font-mono">{walletAddress || "(not connected)"}</span>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <div className="break-all">
              <span className="font-semibold">App ADMIN_USER_ADDRESS constant: </span>
              <span className="font-mono">{ADMIN_USER_ADDRESS}</span>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Server className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <div className="break-all">
              <span className="font-semibold">Server admin (PRIVATE_KEY): </span>
              <span className="font-mono">
                {serverAddr ?? (serverAddrError ? `error: ${serverAddrError}` : "loading…")}
              </span>
            </div>
          </li>
        </ul>
        {serverAddr &&
          walletAddress &&
          serverAddr.toLowerCase() !== walletAddress.toLowerCase() && (
            <p className="mt-3 rounded bg-yellow-100 p-2 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
              ⚠ Your MetaMask wallet ({shortAddr(walletAddress)}) is{" "}
              <strong>different</strong> from the server admin wallet (
              {shortAddr(serverAddr)}). If a group was created via a server-side
              script, only the server wallet can change its rules. Use the{" "}
              <strong>"via server admin"</strong> buttons below.
            </p>
          )}
      </section>

      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        Each group shows: its current on-chain rules, its on-chain admins, and
        action buttons. Use MetaMask buttons when your wallet is the group
        owner; use server-admin buttons when the PRIVATE_KEY wallet is.
      </p>

      <div className="mt-6 space-y-6">
        {/* Commons → open */}
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Unlock className="h-4 w-4" />
            Society-Commons — open to everyone
          </h2>
          <p className="mt-1 break-all text-xs text-gray-400">
            {COMMONS_GROUP_ADDRESS}
          </p>

          <RulesList state={commonsState} />
          <AdminsList
            state={commonsAdmins}
            serverAddr={serverAddr}
            metaMaskAddr={walletAddress}
          />

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sign with MetaMask {!mmCommonsIsAdmin && "(your wallet is NOT a group admin — likely to fail)"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null || !sessionClient.data || !walletClient.data}
                onClick={() =>
                  run("MetaMask: remove approval", () =>
                    disableMembershipApproval(
                      COMMONS_GROUP_ADDRESS,
                      sessionClient.data!,
                      walletClient.data!,
                    ),
                  )
                }
              >
                Remove approval rule
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null || !sessionClient.data || !walletClient.data}
                onClick={() =>
                  run("MetaMask: force open", () =>
                    removeAllGroupRules(
                      COMMONS_GROUP_ADDRESS,
                      sessionClient.data!,
                      walletClient.data!,
                    ),
                  )
                }
              >
                Force open (all rules)
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Sign via server admin (PRIVATE_KEY) — recommended
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy !== null || !serverAddr || !walletClient.data}
                onClick={() =>
                  runWithProof("Server: remove approval", (proof) =>
                    serverDisableMembershipApproval(COMMONS_GROUP_ADDRESS, proof),
                  )
                }
              >
                Remove approval rule (server)
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy !== null || !serverAddr || !walletClient.data}
                onClick={() =>
                  runWithProof("Server: force open", (proof) =>
                    serverRemoveAllGroupRules(COMMONS_GROUP_ADDRESS, proof),
                  )
                }
              >
                Force open all rules (server)
              </Button>
            </div>
          </div>
        </section>

        {/* Research → gated */}
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="h-4 w-4" />
            Society-Research — admin approval required
          </h2>
          <p className="mt-1 break-all text-xs text-gray-400">
            {RESEARCH_GROUP_ADDRESS}
          </p>

          <RulesList state={researchState} />
          <AdminsList
            state={researchAdmins}
            serverAddr={serverAddr}
            metaMaskAddr={walletAddress}
          />

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sign with MetaMask {!mmResearchIsAdmin && "(your wallet is NOT a group admin — likely to fail)"}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={busy !== null || !sessionClient.data || !walletClient.data}
              onClick={() =>
                run("MetaMask: gate research", () =>
                  enableMembershipApproval(
                    RESEARCH_GROUP_ADDRESS,
                    sessionClient.data!,
                    walletClient.data!,
                  ),
                )
              }
            >
              Gate Research
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Sign via server admin (PRIVATE_KEY) — recommended
            </p>
            <Button
              size="sm"
              className="mt-2"
              disabled={busy !== null || !serverAddr || !walletClient.data}
              onClick={() =>
                runWithProof("Server: gate research", (proof) =>
                  serverEnableMembershipApproval(RESEARCH_GROUP_ADDRESS, proof),
                )
              }
            >
              Gate Research (server)
            </Button>
          </div>
        </section>

        <div className="space-y-2 text-sm">
          <div>
            <Link
              href="/admin/setup-globals"
              className="text-blue-600 underline dark:text-blue-400"
            >
              Set up new global groups (signed by your MetaMask) →
            </Link>
          </div>
          <div>
            <Link
              href="/admin/research-requests"
              className="text-blue-600 underline dark:text-blue-400"
            >
              Go to pending Research requests →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
