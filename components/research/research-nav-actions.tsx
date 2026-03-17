"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface ResearchNavActionsProps {
  showNewTopic?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function ResearchNavActions({
  showNewTopic = true,
  backHref,
  backLabel = "Back",
}: ResearchNavActionsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      {backHref ? (
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {showNewTopic && (
        <Link href="/research/new">
          <Button size="sm" className="gradient-button">
            <Plus className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </Link>
      )}
    </div>
  );
}
