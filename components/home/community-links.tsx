import Link from "next/link";
import { Users } from "lucide-react";

interface CommunityLink {
  id: string;
  name: string;
  lensGroupAddress: string;
  membersCount: number;
}

interface CommunityLinksProps {
  communities: CommunityLink[];
}

export function CommunityLinks({ communities }: CommunityLinksProps) {
  if (communities.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No local communities yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {communities.map((c) => (
        <Link
          key={c.id}
          href={`/communities/${c.lensGroupAddress}`}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-600 dark:bg-gray-700 dark:text-gray-300">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-blue-600 dark:text-blue-400">{c.name}</h3>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              {c.membersCount} members
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
