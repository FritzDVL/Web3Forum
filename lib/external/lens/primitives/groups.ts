import {
  joinGroup,
  requestGroupMembership,
  fetchGroupMembershipRequests,
  approveGroupMembershipRequests,
  rejectGroupMembershipRequests,
  fetchGroup,
  updateGroupRules,
} from "@lens-protocol/client/actions";
import {
  evmAddress,
  SessionClient,
  AnyClient,
} from "@lens-protocol/client";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { WalletClient } from "viem";

// ─────────────────────────────────────────────────────────────────────────────
// Shared result type
// ─────────────────────────────────────────────────────────────────────────────
export interface GroupActionResult {
  success: boolean;
  alreadyMember?: boolean;
  error?: string;
}

function isAlreadyMemberError(msg: string): boolean {
  return /already.*member|already joined|membership.*exists/i.test(msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// Member-side actions: join (open groups) / request membership (gated groups)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Join a Lens Group directly. Use only for OPEN groups (no MEMBERSHIP_APPROVAL rule).
 */
export async function joinLensGroup(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const result = await joinGroup(sessionClient, {
      group: evmAddress(groupAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      const alreadyMember = isAlreadyMemberError(msg);
      console.error("[Groups] joinGroup failed:", msg);
      return { success: alreadyMember, alreadyMember, error: alreadyMember ? undefined : msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const alreadyMember = isAlreadyMemberError(msg);
    console.error("[Groups] joinGroup exception:", msg);
    return { success: alreadyMember, alreadyMember, error: alreadyMember ? undefined : msg };
  }
}

/**
 * Submit a join request for a Lens Group with MEMBERSHIP_APPROVAL enabled.
 * The request stays pending until an admin approves it.
 */
export async function requestLensGroupMembership(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const result = await requestGroupMembership(sessionClient, {
      group: evmAddress(groupAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      const alreadyMember = isAlreadyMemberError(msg);
      const alreadyRequested = /already.*request|pending.*request/i.test(msg);
      console.error("[Groups] requestGroupMembership failed:", msg);
      return {
        success: alreadyMember || alreadyRequested,
        alreadyMember,
        error: alreadyMember || alreadyRequested ? undefined : msg,
      };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] requestGroupMembership exception:", msg);
    return { success: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-side actions: list pending requests, approve, reject
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingMembershipRequest {
  account: string;
  username?: string | null;
  displayName?: string | null;
  requestedAt: string;
  ruleId: string;
}

export async function fetchLensGroupMembershipRequests(
  groupAddress: string,
  sessionClient: SessionClient,
): Promise<{ success: boolean; requests?: PendingMembershipRequest[]; error?: string }> {
  try {
    const result = await fetchGroupMembershipRequests(sessionClient, {
      group: evmAddress(groupAddress),
    });

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      console.error("[Groups] fetchGroupMembershipRequests failed:", msg);
      return { success: false, error: msg };
    }

    const requests: PendingMembershipRequest[] = result.value.items.map((req: any) => ({
      account: req.account?.address || "",
      username: req.account?.username?.localName ?? null,
      displayName: req.account?.metadata?.name ?? null,
      requestedAt: req.requestedAt,
      ruleId: req.ruleId,
    }));

    return { success: true, requests };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] fetchGroupMembershipRequests exception:", msg);
    return { success: false, error: msg };
  }
}

export async function approveLensGroupMembershipRequests(
  groupAddress: string,
  accountAddresses: string[],
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const result = await approveGroupMembershipRequests(sessionClient, {
      group: evmAddress(groupAddress),
      accounts: accountAddresses.map((a) => evmAddress(a)),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      console.error("[Groups] approveGroupMembershipRequests failed:", msg);
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] approveGroupMembershipRequests exception:", msg);
    return { success: false, error: msg };
  }
}

export async function rejectLensGroupMembershipRequests(
  groupAddress: string,
  accountAddresses: string[],
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const result = await rejectGroupMembershipRequests(sessionClient, {
      group: evmAddress(groupAddress),
      accounts: accountAddresses.map((a) => evmAddress(a)),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      console.error("[Groups] rejectGroupMembershipRequests failed:", msg);
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] rejectGroupMembershipRequests exception:", msg);
    return { success: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-side actions: toggle MEMBERSHIP_APPROVAL rule on a group
// ─────────────────────────────────────────────────────────────────────────────

export async function getMembershipApprovalRuleIds(
  groupAddress: string,
  client: AnyClient,
): Promise<string[]> {
  const result = await fetchGroup(client, { group: evmAddress(groupAddress) });
  if (result.isErr() || !result.value) return [];
  const group: any = result.value;
  const required = group.rules?.required ?? [];
  const anyOf = group.rules?.anyOf ?? [];
  return [...required, ...anyOf]
    .filter((r: any) => r.type === "MEMBERSHIP_APPROVAL")
    .map((r: any) => r.id);
}

/**
 * Add a MEMBERSHIP_APPROVAL rule to a group (require admin approval to join).
 * Caller must be the group owner/admin.
 */
export async function enableMembershipApproval(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const result = await updateGroupRules(sessionClient, {
      group: evmAddress(groupAddress),
      toAdd: {
        required: [{ membershipApprovalRule: { enable: true } }],
        anyOf: [],
      },
      toRemove: [],
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      console.error("[Groups] enableMembershipApproval failed:", msg);
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] enableMembershipApproval exception:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Remove all MEMBERSHIP_APPROVAL rules from a group (open join for anyone).
 * Caller must be the group owner/admin.
 */
export async function disableMembershipApproval(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const ruleIds = await getMembershipApprovalRuleIds(groupAddress, sessionClient);
    if (ruleIds.length === 0) {
      return { success: true }; // already open — nothing to do
    }

    const result = await updateGroupRules(sessionClient, {
      group: evmAddress(groupAddress),
      toAdd: { required: [], anyOf: [] },
      toRemove: ruleIds as any,
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      console.error("[Groups] disableMembershipApproval failed:", msg);
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] disableMembershipApproval exception:", msg);
    return { success: false, error: msg };
  }
}
