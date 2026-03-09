"use client";

import { ConnectProvider } from "@/components/providers/connect-provider";
import { Env, getCurrentEnv } from "@/lib/env";
import { client } from "@/lib/external/lens/protocol-client";
import { APP_URL } from "@/lib/shared/constants";
import { chains } from "@lens-chain/sdk/viem";
import { LensProvider } from "@lens-protocol/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { useState, useEffect } from "react";

const env = getCurrentEnv();
const isMainnet = env === Env.MAINNET;

const selectedChain = isMainnet ? chains.mainnet : chains.testnet;
const selectedRpc = isMainnet ? http("https://rpc.lens.xyz") : http("https://rpc.testnet.lens.dev");

// Create Wagmi config as a singleton (outside component)
const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [selectedChain],
    transports: {
      [selectedChain.id]: selectedRpc,
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
    appName: "LensForum",
    appUrl: `${APP_URL}/`,
    appIcon: `${APP_URL}/logo.png`,
    // Disable Coinbase telemetry
    walletOptions: {
      coinbaseWallet: {
        preference: 'smartWalletOnly',
        enableMobileWalletLink: false,
      },
    },
  }),
);

// Create QueryClient as a singleton (outside component)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Provider component that wraps the application
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering providers after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LensProvider client={client}>
          <ConnectProvider>{children}</ConnectProvider>
        </LensProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

