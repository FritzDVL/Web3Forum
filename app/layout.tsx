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
    <html lang="en" suppressHydrationWarning className="bg-slate-100 dark:bg-gray-900">
      <body
        className={`${customFont.variable} bg-slate-100 font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Web3Provider>
            <AppProvider>
              <Container>{children}</Container>
            </AppProvider>
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
