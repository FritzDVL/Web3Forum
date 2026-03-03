import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupBannedAccount } from "@lens-protocol/client";
import { UserCheck } from "lucide-react";

interface UnbanMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAccount: GroupBannedAccount | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UnbanMemberDialog({
  open,
  onOpenChange,
  selectedAccount,
  onConfirm,
  isLoading = false,
}: UnbanMemberDialogProps) {
  if (!selectedAccount) return null;

  const username = selectedAccount.account.username?.localName || selectedAccount.account.username?.value || "Unknown";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md rounded-3xl bg-white p-8 backdrop-blur-sm dark:border-gray-600/60 dark:bg-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span className="inline-block rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2 text-white">
              <UserCheck className="h-6 w-6" />
            </span>
            Unban member
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-4 text-base text-muted-foreground">
          Are you sure you want to unban <strong>@{username}</strong>? They will be able to rejoin this community.
        </div>

        <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-3">
          <AlertDialogCancel className="rounded-full bg-muted px-6 py-2 font-semibold text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-muted/80">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-blue-700"
          >
            {isLoading ? "Unbanning..." : "Unban member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
