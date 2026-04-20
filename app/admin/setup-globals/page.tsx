"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShieldAlert, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/hooks/admin/use-is-admin";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { evmAddress, uri } from "@lens-protocol/client";
import {
  createGroup,
  createFeed,
  fetchGroup,
  fetchFeed,
} from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { group as groupMetadata, feed as feedMetadata } from "@lens-protocol/metadata";
import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { immutable } from "@lens-chain/storage-client";

interface CreatedPair {
  name: string;
  groupAddress: string;
  feedAddress: string;
}

export default function SetupGlobalsPage() {
  const isAdmin = useIsAdmin();
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const [name, setName] = useState("Society-Commons");
  const [description, setDescription] = useState(
    "Open community feed. Anyone can join and post.",
  );
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedPair[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold">Admin · Set up Global Groups</h1>
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

  async function handleCreate(openToAll: boolean) {
    if (!sessionClient.data || !walletClient.data) {
      toast.error("Wallet/session not ready");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    const t = toast.loading("Uploading group metadata…");
    try {
      const acl = immutable(lensChain.id);

      // 1. Upload group metadata
      const gMeta = groupMetadata({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      const { uri: gMetaUri } = await storageClient.uploadAsJson(gMeta, { acl });

      // 2. Create group on Lens (signed by user's MetaMask)
      toast.loading("Sign group creation in MetaMask…", { id: t });
      const groupResult = await createGroup(sessionClient.data, {
        metadataUri: uri(gMetaUri),
        ...(openToAll
          ? {}
          : {
              rules: {
                required: [{ membershipApprovalRule: { enable: true } }],
              },
            }),
      })
        .andThen(handleOperationWith(walletClient.data))
        .andThen(sessionClient.data.waitForTransaction)
        .andThen((txHash) => fetchGroup(sessionClient.data!, { txHash }));

      if (groupResult.isErr() || !groupResult.value) {
        const msg = groupResult.isErr()
          ? groupResult.error?.message || String(groupResult.error)
          : "Group not found after creation";
        toast.error("Group creation failed", { description: msg, id: t });
        return;
      }
      const newGroupAddress = (groupResult.value as any).address as string;

      // 3. Upload feed metadata
      toast.loading("Uploading feed metadata…", { id: t });
      const fMeta = feedMetadata({
        name: `${name.trim()} Feed`,
        description: `Posts feed for ${name.trim()}`,
      });
      const { uri: fMetaUri } = await storageClient.uploadAsJson(fMeta, { acl });

      // 4. Create feed gated to the group (signed by user's MetaMask)
      toast.loading("Sign feed creation in MetaMask…", { id: t });
      const feedResult = await createFeed(sessionClient.data, {
        metadataUri: uri(fMetaUri),
        rules: {
          required: [
            {
              groupGatedRule: {
                group: evmAddress(newGroupAddress),
              },
            },
          ],
        },
      })
        .andThen(handleOperationWith(walletClient.data))
        .andThen(sessionClient.data.waitForTransaction)
        .andThen((txHash) => fetchFeed(sessionClient.data!, { txHash }));

      if (feedResult.isErr() || !feedResult.value) {
        const msg = feedResult.isErr()
          ? feedResult.error?.message || String(feedResult.error)
          : "Feed not found after creation";
        toast.error("Group created but feed creation failed", {
          description: `Group: ${newGroupAddress}. Feed error: ${msg}`,
          id: t,
        });
        // Still record what we got
        setCreated((prev) => [
          ...prev,
          { name: name.trim(), groupAddress: newGroupAddress, feedAddress: "(failed)" },
        ]);
        return;
      }
      const newFeedAddress = (feedResult.value as any).address as string;

      toast.success("Group + feed created ✓", { id: t });
      setCreated((prev) => [
        ...prev,
        { name: name.trim(), groupAddress: newGroupAddress, feedAddress: newFeedAddress },
      ]);
    } catch (err) {
      toast.error("Setup failed", {
        description: err instanceof Error ? err.message : String(err),
        id: t,
      });
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/group-rules">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Group Rules
        </Button>
      </Link>

      <h1 className="text-2xl font-bold">Admin · Set up Global Groups</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Create a fresh Lens group + a feed gated to it, both signed by your
        MetaMask wallet (so you become the on-chain owner). Two signatures per
        run. After creation, copy the addresses into{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
          lib/shared/constants.ts
        </code>
        .
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="block text-sm font-semibold">Group name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Society-Commons"
          className="mt-1"
          disabled={busy}
        />

        <label className="mt-4 block text-sm font-semibold">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the group"
          className="mt-1"
          rows={2}
          disabled={busy}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => handleCreate(true)} disabled={busy}>
            {busy ? "Working…" : "Create — fully open"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCreate(false)}
            disabled={busy}
          >
            {busy ? "Working…" : "Create — require admin approval"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          "Fully open" = anyone signed in can join and post in one click. Use
          this for the new Commons. "Require approval" adds the membership
          approval rule — use this for the new Research.
        </p>
      </section>

      {created.length > 0 && (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Created groups</h2>
          {created.map((c, i) => {
            const slugUpper = c.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
            const snippet = `// ${c.name}\nexport const ${slugUpper}_GROUP_ADDRESS: Address = "${c.groupAddress}";\nexport const ${slugUpper}_FEED_ADDRESS:  Address = "${c.feedAddress}";`;
            return (
              <div
                key={i}
                className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
              >
                <h3 className="font-semibold">{c.name}</h3>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Group:</span>
                    <code className="break-all rounded bg-white px-1 py-0.5 dark:bg-gray-900">
                      {c.groupAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => copy(c.groupAddress, `g-${i}`)}
                    >
                      {copied === `g-${i}` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Feed:</span>
                    <code className="break-all rounded bg-white px-1 py-0.5 dark:bg-gray-900">
                      {c.feedAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => copy(c.feedAddress, `f-${i}`)}
                    >
                      {copied === `f-${i}` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold">
                    Paste into lib/shared/constants.ts:
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-100">
                    {snippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => copy(snippet, `s-${i}`)}
                  >
                    {copied === `s-${i}` ? (
                      <>
                        <Check className="mr-1 h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" /> Copy snippet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-500">
            After updating constants.ts, restart your dev server and the app
            will use these new groups everywhere.
          </p>
        </section>
      )}
    </div>
  );
}
