import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CommunitiesHeaderProps {
  total: number;
}

export function CommunitiesHeader({ total }: CommunitiesHeaderProps) {
  return (
    <Card className="mb-8 rounded-3xl bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardContent className="p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-brand-300/30 bg-gradient-to-r from-brand-500/20 to-brand-400/20 px-3 py-1">
              <Users className="mr-2 h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-gray-100">{total} Communities</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Communities</h1>
            <p className="mt-1 text-muted-foreground">Discover and join communities in the Lens ecosystem</p>
          </div>
          <Link href="/communities/new" className="hidden">
            <Button>Create Community</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
