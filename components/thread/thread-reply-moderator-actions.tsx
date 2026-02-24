"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useIsModerator } from "@/hooks/communities/use-is-moderator";
import { useHideReply } from "@/hooks/replies/use-hide-reply";
import { Community } from "@/lib/domain/communities/types";
import { Reply } from "@/lib/domain/replies/types";
import { EyeOff } from "lucide-react";

interface ThreadReplyModeratorActionsProps {
  reply: Reply;
  community: Community;
  isHidden?: boolean;
}

export function ThreadReplyModeratorActions({ reply, community, isHidden = false }: ThreadReplyModeratorActionsProps) {
  const [showHideDialog, setShowHideDialog] = useState(false);

  const isModerator = useIsModerator(community);
  const { hideReplyAction, unhideReplyAction, isLoading } = useHideReply();

  if (!isModerator) {
    return null;
  }

  const handleHideReply = async () => {
    const success = isHidden ? await unhideReplyAction(reply.post.id) : await hideReplyAction(reply.post.id);

    if (success) {
      setShowHideDialog(false);
    }
  };

  const authorName = reply.post.author.metadata?.name || "Unknown User";

  return (
    <>
      {!isHidden ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHideDialog(true)}
          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:h-8 sm:px-2 sm:text-sm"
          title="Hide reply"
        >
          <EyeOff className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Hide</span>
        </Button>
      ) : (
        <Button
          disabled
          variant="ghost"
          size="sm"
          onClick={() => setShowHideDialog(true)}
          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:h-8 sm:px-2 sm:text-sm"
          title="Unhide reply"
        >
          <EyeOff className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Unhide</span>
        </Button>
      )}

      {/* Hide Reply Confirmation Dialog */}
      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent className="w-full max-w-md rounded-3xl bg-white p-8 backdrop-blur-sm dark:border-gray-600/60 dark:bg-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <span className="inline-block rounded-full bg-gradient-to-br from-red-500 to-red-600 p-2 text-white">
                <EyeOff className="h-6 w-6" />
              </span>
              {isHidden ? "Unhide Reply" : "Hide Reply"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {isHidden
                ? `Are you sure you want to make this reply from ${authorName} visible again?`
                : `Are you sure you want to hide this reply from ${authorName}? This will remove the reply from public view in the community.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!isHidden && (
            <div className="py-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠️ Hidden replies can still be seen by moderators
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-full bg-muted px-6 py-2 font-semibold text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHideReply}
              disabled={isLoading}
              className={`rounded-full px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 ${
                isHidden
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              }`}
            >
              {isLoading ? (isHidden ? "Unhiding..." : "Hiding...") : isHidden ? "Unhide Reply" : "Hide Reply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
