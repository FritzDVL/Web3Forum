import { joinGroup } from "@lens-protocol/client/actions";
import { evmAddress, SessionClient } from "@lens-protocol/client";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { WalletClient } from "viem";

export interface JoinGroupResult {
  success: boolean;
  alreadyMember?: boolean;
  error?: string;
}

/**
 * Join a Lens Group. Required to satisfy GROUP_GATED rules on a feed
 * (e.g. the Commons feed requires Society-Commons group membership before
 * a user can publish posts there).
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
      const alreadyMember =
        /already.*member|already joined|membership.*exists/i.test(msg);
      console.error("[Groups] joinGroup failed:", msg);
      return { success: alreadyMember, alreadyMember, error: alreadyMember ? undefined : msg };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const alreadyMember =
      /already.*member|already joined|membership.*exists/i.test(msg);
    console.error("[Groups] joinGroup exception:", msg);
    return { success: alreadyMember, alreadyMember, error: alreadyMember ? undefined : msg };
  }
}
