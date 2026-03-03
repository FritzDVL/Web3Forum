import { createFeedReply } from "@/lib/services/feed/create-feed-reply-client";
import { useAuthStore } from "@/stores/auth-store";
import type { Address } from "@/types/common";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

export function useFeedReplyCreate() {
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const createReplyWithService = async (
    feedId: string,
    parentPostId: string,
    content: string,
    feedAddress: Address,
  ) => {
    if (!sessionClient.data) {
      toast.error("Not logged in", { description: "Please log in to reply." });
      return null;
    }

    if (!walletClient.data) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to reply." });
      return null;
    }

    if (!account) {
      toast.error("Account not available", { description: "Please ensure your account is loaded." });
      return null;
    }

    try {
      const result = await createFeedReply(
        feedId,
        parentPostId,
        content,
        feedAddress,
        account.address,
        sessionClient.data,
        walletClient.data
      );

      if (!result.success) {
        toast.error("Failed to create reply", { description: result.error });
        return null;
      }

      return result.reply || null;
    } catch (error) {
      console.error("Error creating reply:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to create reply", { description: errorMsg });
      return null;
    }
  };

  return { createReply: createReplyWithService };
}
