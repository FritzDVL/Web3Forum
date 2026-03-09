"use client";

import { useEffect, useState } from "react";
import { LensAccountsDialog } from "@/components/auth/login-lens-accounts-dialog";
import { useLogin } from "@/hooks/auth/use-login";
import { useAuthStore } from "@/stores/auth-store";
import { AccountAvailable } from "@lens-protocol/react";
import { ConnectKitProvider } from "connectkit";
import { useAccount } from "wagmi";

// Inner component that uses wagmi hooks
function ConnectMonitor() {
  const { address, isConnected } = useAccount();
  const { setWalletAddress } = useAuthStore();

  // Synchronize wallet connection state with our auth store
  // Use useEffect to avoid setState during render
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    } else if (!isConnected) {
      setWalletAddress(null);
    }
  }, [isConnected, address, setWalletAddress]);

  return null;
}

// Provider component that wraps the application
export function ConnectProvider({ children }: { children: React.ReactNode }) {
  const [isLoginLensDialogOpen, setIsLoginLensDialogOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  const { setWalletAddress, setAccount, setLensSession } = useAuthStore();
  const { login } = useLogin();

  const handleDisconnect = async () => {
    // Clear wallet address on disconnect
    setWalletAddress(null);
    setAccount(null);
    setLensSession(null);
  };

  const handleConnect = async (walletAddress: string) => {
    // When wallet connects, open the login modal to select Lens account
    setIsLoginLensDialogOpen(true);
    setWalletAddress(walletAddress);
  };

  const handleCloseLoginLensDialog = () => {
    setIsLoginLensDialogOpen(false);
  };

  const handleLogin = async (lensAccount: AccountAvailable) => {
    setLoggingIn(lensAccount.account.address);
    try {
      await login(lensAccount, () => {
        setIsLoginLensDialogOpen(false);
      });
    } catch (error) {
      console.error("Error logging in:", error);
    } finally {
      setLoggingIn(null);
    }
  };

  return (
    <ConnectKitProvider onConnect={({ address }) => handleConnect(address ?? "")} onDisconnect={handleDisconnect}>
      <ConnectMonitor />
      <LensAccountsDialog
        isOpen={isLoginLensDialogOpen}
        onClose={handleCloseLoginLensDialog}
        onAccountSelect={handleLogin}
        loadingAccount={loggingIn}
        title="Connect your Lens account"
        description="Select a Lens account to continue"
        buttonText="Connect"
      />
      {children}
    </ConnectKitProvider>
  );
}
