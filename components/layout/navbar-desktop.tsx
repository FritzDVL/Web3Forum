"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginConnectButton } from "@/components/auth/login-connect-button";
import { LensAccountsDialog } from "@/components/auth/login-lens-accounts-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/auth/use-logout";
import { useSwitchAccount } from "@/hooks/auth/use-switch-account";
import { useAuthStore } from "@/stores/auth-store";
import { Bell, Gift, Home, LogOut, RefreshCw, User } from "lucide-react";

export function NavbarDesktop() {
  const [showLensDialog, setShowLensDialog] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  const pathname = usePathname();
  const { account } = useAuthStore();
  const { logout } = useLogout();
  const { switchLensAccount, isLoading: isSwitching } = useSwitchAccount();

  const handleSwitchAccount = async (accountToSwitch: any) => {
    setSwitchingAccount(accountToSwitch.account.address);
    try {
      await switchLensAccount(accountToSwitch, () => setShowLensDialog(false));
    } catch (error) {
      console.error("Error switching account:", error);
    } finally {
      setSwitchingAccount(null);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden border-b border-gray-200 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center">
          <span className="font-custom text-xl font-bold uppercase tracking-wide text-slate-900 dark:text-gray-100">
            SOCIETY PROTOCOL
          </span>
        </Link>
        {/* Desktop Actions */}
        <div className="hidden items-center space-x-3 md:flex">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "yellow"}
              size="sm"
              className="rounded-full px-4 py-2 transition-all duration-300"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {account && (
              <Link href="/notifications">
                <Button
                  variant={pathname === "/notifications" ? "default" : "yellow"}
                  size="icon"
                  className="relative p-2 transition-all duration-300"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <ThemeToggle />
            {account ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer border-2 border-slate-200/60 bg-white/80 shadow-md transition-all duration-300 hover:scale-105 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 dark:border-gray-600 dark:bg-gray-800">
                    <AvatarImage src={account.metadata?.picture || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white">
                      {account.username?.localName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] border border-border bg-white shadow-xl dark:bg-gray-800"
                >
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-yellow-100 hover:text-yellow-900 focus:bg-yellow-100 focus:text-yellow-900 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-200"
                  >
                    <Link href={`/u/${account.username?.localName || "user"}`}>
                      <User className="mr-2 h-4 w-4 text-brand-500" />
                      Go to profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-yellow-100 hover:text-yellow-900 focus:bg-yellow-100 focus:text-yellow-900 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-200"
                  >
                    <Link href={`/rewards`}>
                      <Gift className="mr-2 h-4 w-4 text-brand-500" />
                      Rewards
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowLensDialog(true)}
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-yellow-100 hover:text-yellow-900 focus:bg-yellow-100 focus:text-yellow-900 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-brand-500" />
                    Switch account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:bg-yellow-100 focus:text-yellow-900 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginConnectButton />
            )}
          </div>
        </div>
      </div>
      <LensAccountsDialog
        isOpen={showLensDialog}
        onClose={() => setShowLensDialog(false)}
        onAccountSelect={handleSwitchAccount}
        loadingAccount={switchingAccount || (isSwitching ? "switching" : null)}
        title="Switch Lens account"
        description="Select the Lens account you want to use"
        buttonText="Switch"
      />
    </nav>
  );
}
