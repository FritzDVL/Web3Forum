import Image from "next/image";
import { CommunityHeaderActions } from "@/components/communities/display/community-header-actions";
import { CommunityRuleDetails } from "@/components/communities/rules/community-rule-details";
import { Card, CardContent } from "@/components/ui/card";
import { Community } from "@/lib/domain/communities/types";
import { groveLensUrlToHttp } from "@/lib/shared/utils";
import { MessageCircle, Users } from "lucide-react";

export function CommunityHeader({ community }: { community: Community }) {
  if (!community) return null;

  return (
    <>
      <Card className="mb-8 rounded-3xl bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col items-center space-y-4 md:flex-row md:items-start md:space-x-6 md:space-y-0">
            {/* Logo */}
            <div className="flex h-[80px] w-[80px] items-center justify-center md:mr-6 md:h-[100px] md:w-[100px]">
              {community.group.metadata?.icon ? (
                <Image
                  src={groveLensUrlToHttp(community.group.metadata?.icon)}
                  alt={community.name}
                  width={100}
                  height={100}
                  className="h-[80px] w-[80px] rounded-full border border-slate-200 bg-white object-cover md:h-[100px] md:w-[100px]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-2xl text-foreground md:h-[100px] md:w-[100px]">
                  {community.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Main content: name, desc, stats + actions */}
            <div className="flex w-full min-w-0 flex-1 flex-col">
              <div className="flex w-full flex-col md:flex-row md:items-start md:justify-between">
                {/* Name, desc, stats */}
                <div className="w-full min-w-0 flex-1 text-center md:text-left">
                  <h1 className="mb-2 truncate text-2xl font-bold text-foreground md:text-3xl">{community.name}</h1>
                  <p className="mx-auto mb-4 max-w-2xl whitespace-pre-line break-words text-muted-foreground md:mx-0">
                    {community.group.metadata?.description}
                  </p>
                  <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground md:flex-row md:space-x-6 md:space-y-0">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      {community.memberCount.toLocaleString()} members
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {community.threadsCount} threads
                    </div>
                    {/* Community Rule Message */}
                    <CommunityRuleDetails community={community} />
                  </div>
                </div>
                {/* Actions: desktop only, right-aligned */}
                <div className="hidden md:ml-8 md:flex md:items-start md:justify-end">
                  <CommunityHeaderActions communityAddr={community.group.address} initialCommunity={community} />
                </div>
              </div>
              {/* Actions: mobile only, full width below */}
              <div className="mt-4 flex w-full justify-center md:hidden">
                <CommunityHeaderActions communityAddr={community.group.address} initialCommunity={community} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
