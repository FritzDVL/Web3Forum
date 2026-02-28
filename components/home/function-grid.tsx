import Link from "next/link";
import { Sparkles } from "lucide-react";

interface Feed {
  title: string;
  address: string;
  description: string;
}

interface FunctionGridProps {
  title: string;
  feeds: Feed[];
  borderColor?: string;
}

export function FunctionGrid({ title, feeds, borderColor = "blue" }: FunctionGridProps) {
  const borderColorClass = borderColor === "green" ? "border-blue-600" : "border-blue-600";

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className={`border-l-4 ${borderColorClass} bg-slate-100 px-4 py-3 dark:bg-gray-700`}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-gray-200">
          {title}
        </h3>
      </div>

      {/* Grid Layout */}
      <div className="p-4 space-y-3">
        {/* Row 1: Two large cards (50/50) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feeds.slice(0, 2).map((feed) => (
            <Link
              key={feed.address}
              href={`/commons/${feed.address}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            >
              <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {feed.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Row 2: Three cards (33/33/33) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {feeds.slice(2, 5).map((feed) => (
            <Link
              key={feed.address}
              href={`/commons/${feed.address}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            >
              <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {feed.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Row 3: Three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {feeds.slice(5, 8).map((feed) => (
            <Link
              key={feed.address}
              href={`/commons/${feed.address}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            >
              <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {feed.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Row 4: Three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {feeds.slice(8, 11).map((feed) => (
            <Link
              key={feed.address}
              href={`/commons/${feed.address}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            >
              <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {feed.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
