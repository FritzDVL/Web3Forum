"use client";

import { Button } from "@/components/ui/button";
import { useVoting } from "@/hooks/common/use-voting";
import { useAuthStore } from "@/stores/auth-store";
import { PostId } from "@lens-protocol/react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postid: PostId;
}

export function LikeButton({ postid }: LikeButtonProps) {
  const { hasUserUpvoted, isLoading, scoreState, handleUpvote } = useVoting({ postid });
  const { isLoggedIn } = useAuthStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUpvote}
      disabled={isLoading === "up" || !isLoggedIn}
      className={`flex items-center gap-1.5 px-2 transition-all duration-200 hover:scale-110 ${
        hasUserUpvoted
          ? "text-pink-500 hover:text-pink-600"
          : "text-gray-500 hover:text-pink-500 dark:text-gray-400"
      }`}
    >
      <Heart className={`h-4 w-4 ${hasUserUpvoted ? "fill-pink-500" : ""}`} />
      <span className="text-sm">{scoreState > 0 ? scoreState : ""}</span>
    </Button>
  );
}
