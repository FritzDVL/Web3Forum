"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { joinLensGroup } from "@/lib/external/lens/primitives/groups";
import { COMMONS_GROUP_ADDRESS } from "@/lib/shared/constants";

export function JoinCommonsButton() {
  const [isJoining, setIsJoining] = useState(false);
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const handleJoin = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in first");
      return;
    }
    if (!sessionClient.data || !walletClient.data) {
      toast.error("Please connect your wallet");
      return;
    }

    const loading = toast.loading("Joining Society-Commons…");
    setIsJoining(true);
    try {
      const result = await joinLensGroup(
        COMMONS_GROUP_ADDRESS,
        sessionClient.data,
        walletClient.data,
      );
      if (result.success) {
        toast.success(
          result.alreadyMember
            ? "You're already a member ✓"
            : "Joined Society-Commons ✓ You can now post.",
          { id: loading },
        );
      } else {
        toast.error("Could not join Society-Commons", {
          description: result.error || "Unknown error",
          id: loading,
        });
      }
    } catch (err) {
      toast.error("Could not join Society-Commons", {
        description: err instanceof Error ? err.message : "Unknown error",
        id: loading,
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleJoin}
      disabled={isJoining}
      title="Join the Society-Commons group (required to publish on-chain)"
    >
      <UserPlus className="h-4 w-4" />
      {isJoining ? "Joining…" : "Join Society-Commons"}
    </Button>
  );
}
