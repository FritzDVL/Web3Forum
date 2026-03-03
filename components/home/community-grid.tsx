import Image from "next/image";
import Link from "next/link";
import { Community } from "@/lib/domain/communities/types";
import { groveLensUrlToHttp } from "@/lib/shared/utils";

interface CommunityGridProps {
  communities: Community[];
}

export function CommunityGrid({ communities }: CommunityGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {communities.map(community => (
        <Link
          key={community.id}
          href={`/communities/${community.group.address}`}
          className="group block rounded-2xl border border-slate-200/60 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-600">
              {community.group.metadata?.icon ? (
                <Image
                  src={groveLensUrlToHttp(community.group.metadata.icon)}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                community.name.charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-gray-100">
              {community.name}
            </h3>
            <p className="mb-3 text-sm text-slate-500">
              {community.memberCount.toLocaleString()} members
            </p>
            {community.group.metadata?.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {community.group.metadata.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
