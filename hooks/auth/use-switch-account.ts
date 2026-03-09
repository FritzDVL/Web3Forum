import { useCallback, useState } from "react";
import { client } from "@/lib/external/lens/protocol-client";
import { useAuthStore } from "@/stores/auth-store";
import { fetchAccount } from "@lens-protocol/client/actions";
import { evmAddress, useSwitchAccount as useSwitchAccountLens } from "@lens-protocol/react";
import { AccountAvailable } from "@lens-protocol/react";

export function useSwitchAccount() {
  const [isLoading, setIsLoading] = useState(false);

  const { setAccount, setLensSession } = useAuthStore();
  const { execute: switchAccountLens } = useSwitchAccountLens();

  const switchLensAccount = useCallback(
    async (lensAccount: AccountAvailable, onSwitchSuccess?: () => void) => {
      console.log("🔍 [useSwitchAccount] Switching to:", lensAccount.account.address);
      console.log("  Current account:", lensAccount.account.username?.value);
      
      setIsLoading(true);
      try {
        // Switch account in Lens
        console.log("🚀 [useSwitchAccount] Calling Lens switchAccount...");
        const result = await switchAccountLens({ account: evmAddress(lensAccount.account.address) });
        
        console.log("📊 [useSwitchAccount] Switch result:", {
          hasResult: !!result,
          isErr: result?.isErr()
        });
        
        if (!result) {
          console.error("❌ [useSwitchAccount] No result returned");
          throw new Error("Switch account failed: No result returned");
        }
        if (result.isErr()) {
          console.error("❌ [useSwitchAccount] Switch failed:", result.error);
          throw new Error(result.error?.message || "Switch account failed");
        }
        
        // Set lens session (AuthenticatedUser)
        console.log("✅ [useSwitchAccount] Setting lens session...");
        setLensSession(result.value);
        
        // Fetch the full Account object for the new address
        console.log("🚀 [useSwitchAccount] Fetching account details...");
        const accountResult = await fetchAccount(client, {
          address: evmAddress(lensAccount.account.address),
        });
        
        console.log("📊 [useSwitchAccount] Account fetch result:", {
          isErr: accountResult.isErr()
        });
        
        if (accountResult.isErr()) {
          console.error("❌ [useSwitchAccount] Account fetch failed:", accountResult.error);
          throw new Error(accountResult.error?.message || "Failed to fetch account after switch");
        }
        
        console.log("✅ [useSwitchAccount] Setting account in store...");
        setAccount(accountResult.value);
        
        console.log("✅ [useSwitchAccount] Switch complete!");
        onSwitchSuccess?.();
      } catch (error) {
        console.error("❌ [useSwitchAccount] Exception:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [switchAccountLens, setAccount, setLensSession],
  );

  return {
    switchLensAccount,
    isLoading,
  };
}
