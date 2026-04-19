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

export interface JoinGroupResult extends GroupActionResult {
  /** True when the group required approval and a request was submitted instead. */
  requested?: boolean;
  /** Rule types still attached to the group, when join failed because of rules. */
  blockingRuleTypes?: string[];
}

function isRulesUnsatisfiedError(msg: string): boolean {
  return /not all rules satisf/i.test(msg) || /rules.*not.*satisf/i.test(msg);
}

/**
 * Join a Lens Group with automatic fallback:
 *  - Try direct join (works when group is fully open).
 *  - If "Not all rules satisfied", inspect the group's actual rules.
 *      • If the only blocker is MEMBERSHIP_APPROVAL → submit a join request
 *        and return { success: true, requested: true } so the UI can say
 *        "request submitted, awaiting admin approval".
 *      • Otherwise → return a descriptive error listing the blocking rule
 *        types so the admin knows what to remove.
 */
export async function joinLensGroup(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<JoinGroupResult> {
  try {
    const result = await joinGroup(sessionClient, {
      group: evmAddress(groupAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction);

    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      const alreadyMember = isAlreadyMemberError(msg);
      if (alreadyMember) return { success: true, alreadyMember };

      console.error("[Groups] joinGroup failed:", msg);

      if (isRulesUnsatisfiedError(msg)) {
        return await fallbackForRuleBlock(groupAddress, sessionClient, walletClient);
      }
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const alreadyMember = isAlreadyMemberError(msg);
    if (alreadyMember) return { success: true, alreadyMember };
    console.error("[Groups] joinGroup exception:", msg);
    if (isRulesUnsatisfiedError(msg)) {
      return await fallbackForRuleBlock(groupAddress, sessionClient, walletClient);
    }
    return { success: false, error: msg };
  }
}

async function fallbackForRuleBlock(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<JoinGroupResult> {
  const rulesResult = await fetchGroupRules(groupAddress, sessionClient);
  if (!rulesResult.success || !rulesResult.rules) {
    return {
      success: false,
      error:
        "Join blocked by group rules and the group's rule list could not be read.",
    };
  }
  const types = rulesResult.rules.map((r) => r.type);
  const onlyBlockerIsApproval =
    rulesResult.rules.length > 0 &&
    rulesResult.rules.every((r) => r.type === "MEMBERSHIP_APPROVAL");

  if (onlyBlockerIsApproval) {
    const reqResult = await requestLensGroupMembership(
      groupAddress,
      sessionClient,
      walletClient,
    );
    if (reqResult.success) {
      return { success: true, requested: true };
    }
    return {
      success: false,
      error: reqResult.error || "Could not submit membership request.",
      blockingRuleTypes: types,
    };
  }

  return {
    success: false,
    error: `Join blocked by group rules: ${types.join(", ")}. An admin must remove them at /admin/group-rules.`,
    blockingRuleTypes: types,
  };
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

export interface GroupRuleSummary {
  id: string;
  type: string;
  scope: "required" | "anyOf";
}

/**
 * Inspect the on-chain rules attached to a group (required + anyOf).
 * Returns each rule's id, type, and which scope it's in.
 */
export async function fetchGroupRules(
  groupAddress: string,
  client: AnyClient,
): Promise<{ success: boolean; rules?: GroupRuleSummary[]; error?: string }> {
  try {
    const result = await fetchGroup(client, { group: evmAddress(groupAddress) });
    if (result.isErr()) {
      const msg = result.error?.message || String(result.error);
      return { success: false, error: msg };
    }
    if (!result.value) return { success: true, rules: [] };
    const group: any = result.value;
    const required = (group.rules?.required ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      scope: "required" as const,
    }));
    const anyOf = (group.rules?.anyOf ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      scope: "anyOf" as const,
    }));
    return { success: true, rules: [...required, ...anyOf] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function getMembershipApprovalRuleIds(
  groupAddress: string,
  client: AnyClient,
): Promise<string[]> {
  const r = await fetchGroupRules(groupAddress, client);
  if (!r.success || !r.rules) return [];
  return r.rules
    .filter((rule) => rule.type === "MEMBERSHIP_APPROVAL")
    .map((rule) => rule.id);
}

/**
 * Get IDs of every rule on the group (regardless of type).
 * Use to fully open a group by stripping all join-time rules.
 */
export async function getAllGroupRuleIds(
  groupAddress: string,
  client: AnyClient,
): Promise<string[]> {
  const r = await fetchGroupRules(groupAddress, client);
  if (!r.success || !r.rules) return [];
  return r.rules.map((rule) => rule.id);
}

/**
 * Remove ALL rules from a group so anyone can join in one click.
 * Caller must be the group owner/admin.
 */
export async function removeAllGroupRules(
  groupAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<GroupActionResult> {
  try {
    const ruleIds = await getAllGroupRuleIds(groupAddress, sessionClient);
    if (ruleIds.length === 0) {
      return { success: true };
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
      console.error("[Groups] removeAllGroupRules failed:", msg);
      return { success: false, error: msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Groups] removeAllGroupRules exception:", msg);
    return { success: false, error: msg };
  }
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
