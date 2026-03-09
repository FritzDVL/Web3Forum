import { APP_ADDRESS } from "@/lib/shared/constants";
import { getNotificationDate } from "@/lib/shared/utils";
import { SessionClient } from "@lens-protocol/client";
import type { Notification } from "@lens-protocol/client";
import { fetchNotifications } from "@lens-protocol/client/actions";
import { NotificationType } from "@lens-protocol/react";

export async function fetchAllNotifications(sessionClient: SessionClient): Promise<Notification[]> {
  console.log("🌐 [fetchAllNotifications] Fetching from Lens Protocol...");
  
  const [mainResult, rewardsResult] = await Promise.all([
    fetchNotifications(sessionClient, {
      filter: {
        notificationTypes: [NotificationType.Mentioned, NotificationType.Commented, NotificationType.Reacted],
        apps: [APP_ADDRESS],
      },
    }),
    fetchNotifications(sessionClient, {
      filter: {
        notificationTypes: [NotificationType.TokenDistributed],
      },
    }),
  ]);
  
  console.log("📥 [fetchAllNotifications] API Results:");
  console.log("  Main notifications:", mainResult.isErr() ? "ERROR" : mainResult.value.items.length);
  console.log("  Rewards notifications:", rewardsResult.isErr() ? "ERROR" : rewardsResult.value.items.length);
  
  if (mainResult.isErr()) {
    console.error("  ❌ Main notifications error:", mainResult.error);
  }
  if (rewardsResult.isErr()) {
    console.error("  ❌ Rewards notifications error:", rewardsResult.error);
  }
  
  const mainItems = mainResult.isErr() ? [] : (mainResult.value.items as Notification[]);
  const rewardsItems = rewardsResult.isErr() ? [] : (rewardsResult.value.items as Notification[]);
  const notifications = [...mainItems, ...rewardsItems].sort((a, b) => {
    const dateA = getNotificationDate(a);
    const dateB = getNotificationDate(b);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  console.log("✅ [fetchAllNotifications] Returning", notifications.length, "total notifications");
  return notifications;
}
