"use server";

import { evmAddress } from "@lens-protocol/client";
import { fetchAdminsFor, updateGroupRules } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { recoverMessageAddress } from "viem";
import { getAdminSigner, getAdminWallet } from "@/lib/external/wallets/admin-wallet";
import { getAdminSessionClient } from "@/lib/external/lens/admin-session";
import { client } from "@/lib/external/lens/protocol-client";
import {
  fetchGroupRules,
  getAllGroupRuleIds,
  getMembershipApprovalRuleIds,
} from "@/lib/external/lens/primitives/groups";
import { ADMIN_USER_ADDRESS } from "@/lib/shared/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Admin auth proof — caller signs a recent timestamp with their wallet.
// Server recovers the address and checks it matches ADMIN_USER_ADDRESS.
// Prevents non-admin users from invoking these server actions directly.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PROOF_PREFIX = "society-admin:";
const PROOF_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface AdminProof {
  message: string;
  signature: `0x${string}`;
}

export async function buildAdminProofMessage(): Promise<string> {
  return `${ADMIN_PROOF_PREFIX}${Date.now()}`;
}

async function requireAdmin(proof: AdminProof | undefined): Promise<{
  ok: true;
} | { ok: false; error: string }> {
  if (!proof?.message || !proof?.signature) {
    return { ok: false, error: "Missing admin signature." };
  }
  if (!proof.message.startsWith(ADMIN_PROOF_PREFIX)) {
    return { ok: false, error: "Invalid proof message." };
  }
  const ts = Number(proof.message.slice(ADMIN_PROOF_PREFIX.length));
  if (!Number.isFinite(ts) || Date.now() - ts > PROOF_MAX_AGE_MS) {
    return { ok: false, error: "Admin proof expired — refresh and try again." };
  }
  try {
    const recovered = await recoverMessageAddress({
      message: proof.message,
      signature: proof.signature,
    });
    if (recovered.toLowerCase() !== ADMIN_USER_ADDRESS.toLowerCase()) {
      return { ok: false, error: "Signer is not the admin wallet." };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not verify signature.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Read-only diagnostics (no signature required — addresses + rules are public)
// ─────────────────────────────────────────────────────────────────────────────

export async function getServerAdminAddress(): Promise<{
  success: boolean;
  address?: string;
  error?: string;
}> {
  try {
    const signer = await getAdminSigner();
    return { success: true, address: signer.address };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getGroupOnChainAdmins(groupAddress: string): Promise<{
  success: boolean;
  admins?: string[];
  error?: string;
}> {
  try {
    const result = await fetchAdminsFor(client, {
      address: evmAddress(groupAddress),
    });
    if (result.isErr()) {
      return { success: false, error: result.error.message };
    }
    const admins = result.value.items.map((a: any) => a.account?.address || "");
    return { success: true, admins: admins.filter(Boolean) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getGroupRulesServer(groupAddress: string) {
  const session = await getAdminSessionClient();
  return await fetchGroupRules(groupAddress, session);
}

// ─────────────────────────────────────────────────────────────────────────────
// Write actions — every one of these requires a fresh admin signature.
// ─────────────────────────────────────────────────────────────────────────────

export async function serverRemoveAllGroupRules(
  groupAddress: string,
  proof: AdminProof,
): Promise<{ success: boolean; removed?: number; error?: string }> {
  const auth = await requireAdmin(proof);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const session = await getAdminSessionClient();
    const wallet = await getAdminWallet();
    const ruleIds = await getAllGroupRuleIds(groupAddress, session);
    if (ruleIds.length === 0) return { success: true, removed: 0 };

    const result = await updateGroupRules(session, {
      group: evmAddress(groupAddress),
      toAdd: { required: [], anyOf: [] },
      toRemove: ruleIds as any,
    })
      .andThen(handleOperationWith(wallet))
      .andThen(session.waitForTransaction);

    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true, removed: ruleIds.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function serverDisableMembershipApproval(
  groupAddress: string,
  proof: AdminProof,
): Promise<{ success: boolean; removed?: number; error?: string }> {
  const auth = await requireAdmin(proof);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const session = await getAdminSessionClient();
    const wallet = await getAdminWallet();
    const ruleIds = await getMembershipApprovalRuleIds(groupAddress, session);
    if (ruleIds.length === 0) return { success: true, removed: 0 };

    const result = await updateGroupRules(session, {
      group: evmAddress(groupAddress),
      toAdd: { required: [], anyOf: [] },
      toRemove: ruleIds as any,
    })
      .andThen(handleOperationWith(wallet))
      .andThen(session.waitForTransaction);

    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true, removed: ruleIds.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function serverEnableMembershipApproval(
  groupAddress: string,
  proof: AdminProof,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin(proof);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const session = await getAdminSessionClient();
    const wallet = await getAdminWallet();
    const result = await updateGroupRules(session, {
      group: evmAddress(groupAddress),
      toAdd: {
        required: [{ membershipApprovalRule: { enable: true } }],
        anyOf: [],
      },
      toRemove: [],
    })
      .andThen(handleOperationWith(wallet))
      .andThen(session.waitForTransaction);

    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
