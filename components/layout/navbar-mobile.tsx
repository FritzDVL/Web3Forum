"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginConnectButton } from "@/components/auth/login-connect-button";
import { LensAccountsDialog } from "@/components/auth/login-lens-accounts-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/auth/use-logout";
import { useSwitchAccount } from "@/hooks/auth/use-switch-account";
import { useAuthStore } from "@/stores/auth-store";
import { Bell, FlaskConical, Gift, Home, LogOut, Menu, RefreshCw, User, X } from "lucide-react";

export function NavbarMobile() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
          <span className="font-custom text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-gray-100 sm:text-xl">
            SOCIETY PROTOCOL
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          {/* Notifications button - outside hamburger */}
          {account && (
            <Link href="/notifications">
              <Button
                variant={pathname === "/notifications" ? "default" : "ghost"}
                size="icon"
                className="relative rounded-full transition-all duration-300"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {/* Theme Toggle - outside hamburger */}
          <ThemeToggle />
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mt-4 rounded-2xl border-t border-border bg-white pb-4 shadow-lg backdrop-blur-md dark:bg-gray-800 md:hidden">
          <div className="space-y-3 pt-4">
            {/* Navigation Links Section */}
            <div className="border-b border-border pb-3">
              <div className="mb-2 px-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigation</h3>
              </div>
              <Link href="/" className="block px-3">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-full transition-all duration-300 ${
                    pathname === "/"
                      ? "bg-brand-600 text-white shadow-md hover:bg-brand-700"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/research" className="block px-3">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-full transition-all duration-300 ${
                    pathname.startsWith("/research")
                      ? "bg-brand-600 text-white shadow-md hover:bg-brand-700"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Research
                </Button>
              </Link>
            </div>

            {/* User Profile Section */}
            {account ? (
              <div>
                <div className="mb-2 px-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
                </div>
                {/* User Info Display */}
                <div className="mb-3 px-3">
                  <div className="flex items-center space-x-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-slate-200/60 bg-white/80 shadow-md transition-all duration-300 hover:scale-105 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 dark:border-gray-600 dark:bg-gray-800">
                      {account.metadata?.picture ? (
                        <Image
                          src={account.metadata.picture}
                          alt={account.username?.localName || "User"}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
                          {account.username?.localName?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {account.username?.localName || "Unknown User"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{account.username?.localName || "unknown"}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href={`/u/${account.username?.localName || "user"}`} className="block px-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Go to profile
                  </Button>
                </Link>
                <Link href="/rewards" className="block px-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Rewards
                  </Button>
                </Link>
                <div className="block px-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowLensDialog(true)}
                    className="w-full justify-start rounded-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Switch account
                  </Button>
                </div>
                <div className="block px-3">
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start rounded-full transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 px-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
                </div>
                <div className="px-3">
                  <div className="rounded-full bg-gradient-to-r from-brand-50 to-white p-1 shadow-md backdrop-blur-sm dark:from-gray-800 dark:to-gray-700">
                    <LoginConnectButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
