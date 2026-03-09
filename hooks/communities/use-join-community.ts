import { Community } from "@/lib/domain/communities/types";
import { joinCommunity } from "@/lib/services/membership/join-community";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

/**
 * Custom hook to join a Lens Protocol community.
 * Handles wallet interaction, membership state, and toast feedback.
 */
export function useJoinCommunity(community: Community) {
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();

  const join = async () => {
    console.log("🔍 [useJoinCommunity] Called for:", community.name);
    console.log("  sessionClient.data exists:", !!sessionClient.data);
    console.log("  walletClient.data exists:", !!walletClient.data);
    
    if (!sessionClient.data) {
      console.error("❌ [useJoinCommunity] Not logged in");
      toast.error("Not logged in", {
        description: "Please log in to join communities.",
      });
      return false;
    }
    if (!walletClient.data) {
      console.error("❌ [useJoinCommunity] Wallet not connected");
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to join communities.",
      });
      return false;
    }
    
    const toastIsJoining = toast.loading("Joining community...");
    console.log("🚀 [useJoinCommunity] Calling joinCommunity service...");
    
    try {
      const result = await joinCommunity(community, sessionClient.data, walletClient.data);
      console.log("📊 [useJoinCommunity] Service result:", result);

      if (result.success) {
        console.log("✅ [useJoinCommunity] Join successful");
        toast.success("You have joined the community!");
        return true;
      } else {
        console.error("❌ [useJoinCommunity] Join failed:", result.error);
        throw new Error(result.error || "Failed to join community");
      }
    } catch (error) {
      console.error("❌ [useJoinCommunity] Exception:", error);
      toast.error("Action Failed", {
        description: "Unable to update your membership status. Please try again.",
      });
      return false;
    } finally {
      toast.dismiss(toastIsJoining);
    }
  };

  return join;
}
