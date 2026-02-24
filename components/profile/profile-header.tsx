import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Account } from "@lens-protocol/client";
import { Calendar, LinkIcon, MapPin } from "lucide-react";

interface ProfileHeaderProps {
  lensAccount: Account;
  username: string;
}

export function ProfileHeader({ lensAccount, username }: ProfileHeaderProps) {
  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-32 overflow-hidden rounded-2xl sm:h-48 sm:rounded-3xl md:h-64">
        {lensAccount?.metadata?.coverPicture ? (
          <>
            <Image
              src={lensAccount.metadata.coverPicture}
              alt="Cover"
              className="h-full w-full object-cover"
              width={300}
              height={100}
            />
            <div className="absolute inset-0 bg-blue-900/20"></div>
          </>
        ) : (
          <>
            <div className="h-full w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </>
        )}
      </div>
      {/* Profile Info */}
      <div className="relative -mt-12 px-3 sm:-mt-20 sm:px-6">
        <div className="flex flex-col items-start space-y-3 sm:space-y-4 md:flex-row md:items-end md:space-x-6 md:space-y-0">
          <Avatar className="h-20 w-20 border-2 border-white ring-2 ring-blue-100 sm:h-32 sm:w-32 sm:border-4">
            <AvatarImage src={lensAccount?.metadata?.picture || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-r from-blue-400 to-blue-600 text-2xl text-white sm:text-4xl">
              {(lensAccount?.metadata?.name || lensAccount?.username?.localName || username)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-2xl bg-card/70 p-4 backdrop-blur-sm sm:rounded-3xl sm:p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                    {lensAccount?.metadata?.name || lensAccount?.username?.localName || username}
                  </h1>
                </div>
                <p className="mb-2 text-sm font-medium text-blue-600 sm:text-base">
                  @{lensAccount?.username?.localName || username}
                </p>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  {lensAccount?.metadata?.bio || "No bio available"}
                </p>
              </div>
            </div>
            {/* Stats Row */}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/60 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:gap-6 sm:pt-4">
              <div className="flex items-center text-xs text-muted-foreground sm:text-sm">
                <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                {lensAccount?.createdAt
                  ? new Date(lensAccount.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
                  : "Unknown date"}
              </div>
              <div className="flex items-center text-xs text-muted-foreground sm:text-sm">
                <MapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                {lensAccount?.metadata?.attributes?.find(attr => attr.key === "location" || attr.key === "city")
                  ?.value || "Location not set"}
              </div>
              <div className="flex items-center text-xs text-muted-foreground sm:text-sm">
                <LinkIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                <a
                  href={
                    lensAccount?.metadata?.attributes?.find(attr => attr.key === "website" || attr.key === "url")
                      ?.value || "#"
                  }
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {lensAccount?.metadata?.attributes?.find(attr => attr.key === "website" || attr.key === "url")
                    ?.value || "No website"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
