/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@walletconnect", "walletconnect", "connectkit"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: config => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    
    // Ignore HeartbeatWorker.js completely to avoid WalletConnect/ConnectKit build errors
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      loader: "ignore-loader",
    });
    
    return config;
  },
};

export default nextConfig;
