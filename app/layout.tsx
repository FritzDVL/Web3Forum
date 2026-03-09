import type React from "react";
import localFont from "next/font/local";
import "./globals.css";
import { Container } from "@/components/layout/container";
import { AppProvider } from "@/components/providers/app-provider";
import { Web3Provider } from "@/components/providers/web3-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const customFont = localFont({
  src: "../public/3534416bbfdcc9be-s.p.woff2",
  variable: "--font-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LensForum - Decentralized Communities",
  description: "Join the future of community discussions on Lens Protocol",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f1f5f9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className={`${customFont.variable} min-h-screen bg-slate-100 font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Web3Provider>
            <AppProvider>
              <Container>{children}</Container>
            </AppProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
