"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { createResearchResponse } from "@/lib/services/research/create-research-response";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useResearchResponseCreate(rootLensPostId: string) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (!account?.address || !sessionClient.data || !walletClient.data) {
      toast.error("Please sign in and connect your wallet");
      return;
    }

    const loadingToast = toast.loading("Posting response...");
    setIsSubmitting(true);

    try {
      const result = await createResearchResponse(
        rootLensPostId,
        content,
        account.address,
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) throw new Error(result.error || "Failed to post response");

      toast.success("Response posted!", { id: loadingToast });
      setContent("");
      setEditorKey((prev) => prev + 1);
      router.refresh();
    } catch (error) {
      toast.error("Failed to post response", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertQuote = (text: string, authorName: string) => {
    const quotedLines = text.split("\n").map((line) => `> ${line}`).join("\n");
    const quote = `> **@${authorName}** wrote:\n${quotedLines}\n\n`;
    setContent((prev) => quote + prev);
    setEditorKey((prev) => prev + 1);
  };

  return {
    content, setContent,
    isSubmitting, editorKey,
    handleSubmit, insertQuote,
  };
}
