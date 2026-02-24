import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Rule {
  text: string;
  type?: "positive" | "negative" | "neutral";
}

interface RulesGuidelinesProps {
  title?: string;
  rules?: Rule[] | string[];
  className?: string;
  variant?: "community" | "posting";
}

// Default community rules
const DEFAULT_COMMUNITY_RULES: Rule[] = [
  { text: "Be respectful and constructive", type: "positive" },
  { text: "No spam", type: "negative" },
  { text: "Share resources and help others learn", type: "positive" },
  { text: "Use appropriate tags for your posts", type: "positive" },
  { text: "Follow community guidelines and stay on topic", type: "positive" },
  { text: "Help maintain a welcoming environment for all members", type: "positive" },
];

// Default posting guidelines
const DEFAULT_POSTING_GUIDELINES: Rule[] = [
  { text: "Be respectful and constructive", type: "positive" },
  { text: "Use clear, descriptive titles", type: "positive" },
  { text: "Add relevant tags", type: "positive" },
  { text: "Include context and details", type: "positive" },
  { text: "No spam or self-promotion", type: "negative" },
];

export function RulesGuidelines({ title, rules, className = "", variant = "community" }: RulesGuidelinesProps) {
  // Determine default rules and title based on variant
  const defaultRules = variant === "posting" ? DEFAULT_POSTING_GUIDELINES : DEFAULT_COMMUNITY_RULES;
  const defaultTitle = variant === "posting" ? "Guidelines" : "Community Rules";

  // Normalize rules to Rule[] format
  const normalizedRules: Rule[] = (rules || defaultRules).map(rule =>
    typeof rule === "string" ? { text: rule, type: "neutral" } : rule,
  );

  const getIcon = (type: Rule["type"]) => {
    switch (type) {
      case "positive":
        return <span className="text-blue-600">✓</span>;
      case "negative":
        return <span className="text-red-500">×</span>;
      default:
        return <span className="text-slate-500">•</span>;
    }
  };

  const getNumberIcon = (index: number) => <span className="mt-0.5 text-sm font-bold text-blue-500">{index + 1}.</span>;

  return (
    <Card className={`rounded-3xl bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <h3 className="text-lg font-medium text-foreground">{title || defaultTitle}</h3>
      </CardHeader>
      <CardContent>
        {normalizedRules.length > 0 ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            {normalizedRules.map((rule, index) => (
              <div key={index} className="flex items-center space-x-2">
                {variant === "posting" ? getIcon(rule.type) : getNumberIcon(index)}
                <span>{rule.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">No rules defined</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
