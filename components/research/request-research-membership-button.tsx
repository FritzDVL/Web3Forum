"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { requestLensGroupMembership } from "@/lib/external/lens/primitives/groups";
import { RESEARCH_GROUP_ADDRESS } from "@/lib/shared/constants";

export function RequestResearchMembershipButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const handleClick = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in first");
      return;
    }
    if (!sessionClient.data || !walletClient.data) {
      toast.error("Please connect your wallet");
      return;
    }

    const loading = toast.loading("Submitting your request…");
    setIsSubmitting(true);
    try {
      const result = await requestLensGroupMembership(
        RESEARCH_GROUP_ADDRESS,
        sessionClient.data,
        walletClient.data,
      );
      if (result.success) {
        toast.success(
          result.alreadyMember
            ? "You're already a member ✓"
            : "Request submitted ✓ An admin will review it shortly.",
          { id: loading },
        );
      } else {
        toast.error("Could not submit request", {
          description: result.error || "Unknown error",
          id: loading,
        });
      }
    } catch (err) {
      toast.error("Could not submit request", {
        description: err instanceof Error ? err.message : "Unknown error",
        id: loading,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={isSubmitting}
      title="Request membership in the Research group (admin approval required to publish)"
    >
      <Mail className="h-4 w-4" />
      {isSubmitting ? "Submitting…" : "Request Research Access"}
    </Button>
  );
}
