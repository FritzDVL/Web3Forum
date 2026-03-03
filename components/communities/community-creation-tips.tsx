"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Tip {
  text: string;
  type: "positive" | "negative";
}

interface CommunityCreationTipsProps {
  className?: string;
  tips?: Tip[];
}

const DEFAULT_TIPS: Tip[] = [
  { text: "Pick a clear, descriptive name", type: "positive" },
  { text: "Choose a relevant category", type: "positive" },
  { text: "Write a concise, inviting description", type: "positive" },
  { text: "Use an emoji to make your community stand out", type: "positive" },
  { text: "No spam or irrelevant content", type: "negative" },
];

export function CommunityCreationTips({ className = "", tips = DEFAULT_TIPS }: CommunityCreationTipsProps) {
  const getIcon = (type: Tip["type"]) => {
    return type === "positive" ? <span className="text-blue-500">✓</span> : <span className="text-red-500">×</span>;
  };

  return (
    <Card className={`rounded-3xl bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800 ${className}`}>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">Community Creation Tips</h3>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-2">
            {getIcon(tip.type)}
            <span>{tip.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
