import { Community, Moderator } from "@/lib/domain/communities/types";
import { ADMIN_USER_ADDRESS, LENS_CONTRACT_GROUP_MANAGER } from "@/lib/shared/constants";
import { CommunitySupabase } from "@/types/supabase";
import { Group, GroupStatsResponse } from "@lens-protocol/client";

/**
 * Transform a Lens Group object to a Community object
 */
export function adaptGroupToCommunity(
  group: Group,
  groupStats: GroupStatsResponse,
  dbCommunity: CommunitySupabase,
  moderators: Moderator[],
): Community {
  const createdAt = group.timestamp ? new Date(group.timestamp).toISOString() : new Date().toISOString();
  if (!group.feed) {
    throw new Error("Group feed is missing");
  }

  return {
    id: dbCommunity.id,
    name: dbCommunity.name || group.metadata?.name || "",
    group,
    feed: group.feed,
    moderators: moderators.filter(
      mod => mod.address !== ADMIN_USER_ADDRESS && mod.address !== LENS_CONTRACT_GROUP_MANAGER,
    ),
    postCount: group.feed.stats?.posts || 0,
    memberCount: groupStats.totalMembers || 0,
    threadsCount: dbCommunity.threads_count || 0,
    isVisible: dbCommunity.visible,
    createdAt,
  };
}
