import { MessageCircle, Sparkles, Users } from "lucide-react";

interface StatsBarProps {
  loadingStats: boolean;
  statsError: boolean;
  forumStats?: {
    members?: number;
    threads?: number;
    communities?: number;
  };
}

export function StatsBar({ loadingStats, statsError, forumStats }: StatsBarProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="group cursor-pointer rounded-2xl border border-border bg-white p-4 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/60 dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 rounded-full bg-blue-100 p-2 transition-all group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/50">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Total Members</p>
          <p className="text-lg font-bold text-foreground">
            {loadingStats ? (
              <span className="animate-pulse text-muted-foreground">...</span>
            ) : statsError ? (
              <span className="text-red-500">!</span>
            ) : (
              (forumStats?.members?.toLocaleString() ?? 0)
            )}
          </p>
        </div>
      </div>
      <div className="group cursor-pointer rounded-2xl border border-border bg-white p-4 backdrop-blur-sm transition-all hover:scale-105 hover:border-blue-300/60 dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 rounded-full bg-blue-100 p-2 transition-all group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/50">
            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Active Threads</p>
          <p className="text-lg font-bold text-foreground">
            {loadingStats ? (
              <span className="animate-pulse text-muted-foreground">...</span>
            ) : statsError ? (
              <span className="text-red-500">!</span>
            ) : (
              (forumStats?.threads?.toLocaleString() ?? 0)
            )}
          </p>
        </div>
      </div>
      <div className="group cursor-pointer rounded-2xl border border-border bg-white p-4 backdrop-blur-sm transition-all hover:scale-105 hover:border-amber-300/60 dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 rounded-full bg-amber-100 p-2 transition-all group-hover:bg-amber-200 dark:bg-amber-900/30 dark:group-hover:bg-amber-800/50">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Communities</p>
          <p className="text-lg font-bold text-foreground">
            {loadingStats ? (
              <span className="animate-pulse text-muted-foreground">...</span>
            ) : statsError ? (
              <span className="text-red-500">!</span>
            ) : (
              (forumStats?.communities?.toLocaleString() ?? 0)
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
