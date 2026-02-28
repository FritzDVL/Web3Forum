"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSessionClient } from "@lens-protocol/react";
import { createFeedReply } from "@/lib/services/feed/create-feed-reply";
import { Address } from "@/types/common";

export function useFeedReplyForm(postId: string, feedAddress: Address) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: sessionClient } = useSessionClient();
  const { data: walletClient } = useWalletClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError("Reply content is required");
      return;
    }

    if (!sessionClient) {
      setError("Please sign in to reply");
      return;
    }

    if (!walletClient) {
      setError("Wallet not connected");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create reply directly on client side
      const { storageClient } = await import("@/lib/external/grove/client");
      const { lensChain } = await import("@/lib/external/lens/chain");
      const { client } = await import("@/lib/external/lens/protocol-client");
      const { immutable } = await import("@lens-chain/storage-client");
      const { evmAddress, postId: toPostId, uri } = await import("@lens-protocol/client");
      const { fetchPost, post } = await import("@lens-protocol/client/actions");
      const { handleOperationWith } = await import("@lens-protocol/client/viem");
      const { textOnly } = await import("@lens-protocol/metadata");

      // 1. Create metadata
      const metadata = textOnly({ content });

      // 2. Upload metadata to storage
      const acl = immutable(lensChain.id);
      const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

      // 3. Post to Lens Protocol
      const result = await post(sessionClient, {
        contentUri: uri(replyUri),
        commentOn: { post: toPostId(postId) },
        feed: evmAddress(feedAddress),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
        .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

      if (result.isErr()) {
        const errorMessage =
          result.error && typeof result.error === "object" && "message" in result.error
            ? (result.error as any).message
            : "Failed to create reply";
        throw new Error(errorMessage);
      }

      setContent("");
      // Refresh the page to show new reply
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    content,
    setContent,
    isSubmitting,
    error,
    handleSubmit,
    isAuthenticated: !!sessionClient,
    userAddress: address,
  };
}
