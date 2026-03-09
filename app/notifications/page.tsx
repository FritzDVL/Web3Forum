"use client";

import { useState } from "react";
import { NotificationsFilter } from "@/components/notifications/notifications-filter";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { StatusBanner } from "@/components/shared/status-banner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNotifications } from "@/hooks/notifications/use-notifications";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "mentions" | "comments" | "reactions" | "rewards">("all");
  const { notifications, loading, error } = useNotifications();
  const { account, isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();

  // Debug info
  console.log("🔍 [NotificationsPage] Render state:");
  console.log("  isLoggedIn:", isLoggedIn);
  console.log("  account exists:", !!account);
  console.log("  sessionClient.data exists:", !!sessionClient.data);
  console.log("  loading:", loading);
  console.log("  error:", error);
  console.log("  notifications count:", notifications.length);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Stay up to date with mentions, replies and reactions to your posts
          </p>
        </div>
      </div>

      {/* Debug Panel - Remove after fixing */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <h3 className="mb-2 font-bold text-yellow-900 dark:text-yellow-200">🐛 Debug Info</h3>
          <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
            <div>Auth Store - isLoggedIn: {isLoggedIn ? "✅" : "❌"}</div>
            <div>Auth Store - account: {account ? `✅ ${account.username?.localName}` : "❌"}</div>
            <div>Session Client - data: {sessionClient.data ? "✅" : "❌"}</div>
            <div>Session Client - loading: {sessionClient.loading ? "⏳" : "✅"}</div>
            <div>Notifications - loading: {loading ? "⏳" : "✅"}</div>
            <div>Notifications - error: {error || "None"}</div>
            <div>Notifications - count: {notifications.length}</div>
          </div>
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
            Check browser console for detailed logs
          </p>
        </div>
      )}

      <div className="mb-6">
        <NotificationsFilter currentFilter={filter} onFilterChange={setFilter} notifications={notifications} />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your notifications..." />
      ) : error ? (
        <StatusBanner type="error" title="Error loading notifications" message={error} />
      ) : (
        <NotificationsList filter={filter} notifications={notifications} />
      )}
    </div>
  );
}
