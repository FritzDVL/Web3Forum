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
import { useMemo } from "react";

const env = getCurrentEnv();
const isMainnet = env === Env.MAINNET;

const selectedChain = isMainnet ? chains.mainnet : chains.testnet;
const selectedRpc = isMainnet ? http("https://rpc.lens.xyz") : http("https://rpc.testnet.lens.dev");

// Create Wagmi config using ConnectKit's default configuration (singleton)
let wagmiConfig: ReturnType<typeof createConfig> | null = null;

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = createConfig(
      getDefaultConfig({
        chains: [selectedChain],
        transports: {
          [selectedChain.id]: selectedRpc,
        },
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
        appName: "LensForum",
        appUrl: `${APP_URL}/`,
        appIcon: `${APP_URL}/logo.png`,
      }),
    );
  }
  return wagmiConfig;
}

// Provider component that wraps the application
export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Use useMemo to ensure QueryClient is only created once
  const queryClient = useMemo(() => new QueryClient(), []);
  const config = useMemo(() => getWagmiConfig(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <LensProvider client={client}>
          <ConnectProvider>{children}</ConnectProvider>
        </LensProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

