import React from "react";
import { TokenDistribution } from "@/lib/domain/rewards/token-distribution";
import { Calendar } from "lucide-react";

interface RewardsHistoryProps {
  distributions: TokenDistribution[];
  loading: boolean;
  isRewardsAvailable: boolean;
}

export function RewardsHistory({ distributions, loading, isRewardsAvailable }: RewardsHistoryProps) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
        <p className="mt-3 text-gray-600 dark:text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (!isRewardsAvailable || distributions.length === 0) {
    return (
      <div className="py-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No rewards history yet</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your rewards transactions will appear here once the system is live.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Show only last 50 distributions for performance */}
      <div className="space-y-3">
        {distributions.map((distribution, index) => (
          <div
            key={distribution.id || index}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{distribution.type}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(distribution.timestamp).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                +{parseFloat(distribution.amount).toFixed(5)} {distribution.token}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
