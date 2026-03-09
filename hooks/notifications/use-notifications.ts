import { useEffect, useState } from "react";
import { getAllNotifications } from "@/lib/services/notifications/get-all-notifications";
import type { Notification } from "@lens-protocol/client";
import { useSessionClient } from "@lens-protocol/react";

export function useNotifications() {
  const sessionClient = useSessionClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      console.log("🔍 [useNotifications] Starting load...");
      console.log("  sessionClient.loading:", sessionClient.loading);
      console.log("  sessionClient.data exists:", !!sessionClient.data);
      
      if (sessionClient.loading) {
        console.log("  ⏳ Session still loading, skipping...");
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const result = await getAllNotifications(sessionClient);
      console.log("📬 [useNotifications] Result:", {
        notificationCount: result.notifications.length,
        hasError: !!result.error,
        error: result.error
      });
      
      setNotifications(result.notifications);
      setError(result.error);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionClient.data]);

  const isLoading = sessionClient.loading || loading;

  return { notifications, loading: isLoading, error };
}
