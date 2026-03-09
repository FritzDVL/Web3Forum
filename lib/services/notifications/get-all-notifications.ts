import { fetchAllNotifications } from "@/lib/external/lens/primitives/notifications";
import type { Notification } from "@lens-protocol/client";

export async function getAllNotifications(sessionClient: any): Promise<{
  notifications: Notification[];
  error: string | null;
}> {
  console.log("📡 [getAllNotifications] Called");
  console.log("  sessionClient exists:", !!sessionClient);
  console.log("  sessionClient.data exists:", !!sessionClient?.data);
  
  if (!sessionClient || !sessionClient.data) {
    console.error("❌ [getAllNotifications] Not authenticated");
    return {
      notifications: [],
      error: "You must be logged in to view notifications.",
    };
  }
  
  try {
    console.log("🚀 [getAllNotifications] Fetching from Lens API...");
    const notifications = await fetchAllNotifications(sessionClient.data);
    console.log("✅ [getAllNotifications] Success:", notifications.length, "notifications");
    return { notifications, error: null };
  } catch (e: any) {
    console.error("❌ [getAllNotifications] Error:", e);
    console.error("  Error message:", e.message);
    console.error("  Error stack:", e.stack);
    return {
      notifications: [],
      error: e.message || "Unknown error",
    };
  }
}
