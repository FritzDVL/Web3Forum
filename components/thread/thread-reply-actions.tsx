import { useState } from "react";
import { TipGhoPopover } from "@/components/shared/tip-gho-popover";
import { Button } from "@/components/ui/button";
import { PostId } from "@lens-protocol/client";
import { Reply } from "lucide-react";
import { toast } from "sonner";

interface ThreadReplyActionsProps {
  replyId: string;
  setReplyingTo?: (id: string | null) => void;
  canReply: boolean;
  canTip: boolean;
}

export function ThreadReplyActions({ replyId, setReplyingTo, canReply, canTip }: ThreadReplyActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleReply = () => {
    if (setReplyingTo) setReplyingTo(replyId);
  };

  const handleCopyLink = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    const url = `${window.location.origin}/reply/${replyId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Reply link copied to clipboard!");
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {setReplyingTo && canReply && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:h-8 sm:px-3 sm:text-sm"
          onClick={handleReply}
          disabled={!canReply}
        >
          <Reply className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Reply</span>
          <span className="sm:hidden">Rep</span>
        </Button>
      )}
      {canTip && <TipGhoPopover to={replyId as PostId} />}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs text-blue-600 hover:text-blue-700 focus:outline-none dark:text-blue-400 dark:hover:text-blue-300 sm:h-8 sm:px-2 sm:text-sm ${copied ? "text-blue-500" : ""}`}
        title="Copy reply link"
        onClick={handleCopyLink}
      >
        <svg
          className="mr-1 h-3 w-3 sm:h-4 sm:w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7a5 5 0 0 1 0-10h2m1 5h4"
          />
        </svg>
        <span className="hidden sm:inline">{copied ? "Copied!" : "Copy link"}</span>
        <span className="sm:hidden">{copied ? "✓" : "Copy"}</span>
      </Button>
    </div>
  );
}
