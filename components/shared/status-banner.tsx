import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface StatusBannerProps {
  type?: "error" | "info" | "success" | "warning";
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

const typeStyles: Record<string, { color: string; icon: React.ReactNode }> = {
  error: {
    color: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    icon: <AlertCircle className="h-8 w-8" />,
  },
  info: {
    color: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-700/20 dark:text-gray-400",
    icon: <Info className="h-8 w-8" />,
  },
  success: {
    color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    icon: <CheckCircle2 className="h-8 w-8" />,
  },
  warning: {
    color:
      "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: <AlertTriangle className="h-8 w-8" />,
  },
};

export function StatusBanner({ type = "info", title, message, icon }: StatusBannerProps) {
  const { color, icon: defaultIcon } = typeStyles[type] ?? typeStyles.info;

  return (
    <div className={`rounded-xl border p-8 text-center ${color}`}>
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-opacity-10">
          {icon ?? defaultIcon}
        </div>
        <h3 className="mb-2 text-lg font-medium">{title}</h3>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}
