import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { Thread } from "@/lib/domain/threads/types";
import { getTimeAgo } from "@/lib/shared/utils";
import { MessageCircle } from "lucide-react";

interface CommunityThreadCardProps {
  thread: Thread;
}

export function CommunityThreadCard({ thread }: CommunityThreadCardProps) {
  const router = useRouter();
  const { title, summary } = getThreadTitleAndSummary(thread.rootPost);

  return (
    <Card
      key={thread.id}
      className="group w-full min-w-0 cursor-pointer rounded-2xl border bg-white transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:bg-gray-800"
      onClick={() => router.push(`/thread/${thread.slug}`)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col">
          {/* Top: title/summary left, author right */}
          <div className="flex w-full items-start">
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-brand-600">
                {title}
              </h3>
              <p className="mb-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
            </div>
            <div className="ml-4 flex min-w-[160px] flex-col items-end">
              {thread.author && (
                <Link
                  href={`/u/${thread.author.username?.localName}`}
                  className="flex items-center hover:text-brand-600"
                  onClick={e => e.stopPropagation()}
                >
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage src={thread.author.metadata?.picture || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{thread.author.username?.localName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{thread.author.username?.localName}</span>
                </Link>
              )}
              <span className="mt-1 text-xs text-muted-foreground">{getTimeAgo(new Date(thread.created_at))}</span>
            </div>
          </div>
          {/* Bottom: replies count */}
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <MessageCircle className="mr-1 h-4 w-4" />
            {thread.repliesCount} replies
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
