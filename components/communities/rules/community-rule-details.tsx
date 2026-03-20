import React from "react";
import { Community } from "@/lib/domain/communities/types";
import { GroupRuleType } from "@lens-protocol/client";
import { DollarSign, KeyRound, ShieldCheck } from "lucide-react";

interface CommunityRuleDetailsProps {
  community: Community;
  className?: string;
}
export const CommunityRuleDetails: React.FC<CommunityRuleDetailsProps> = ({ community, className = "" }) => {
  const currentRule = community.group.rules?.required?.[0];
  const ruleType = currentRule?.type;

  if (!ruleType || ruleType === "none") {
    return null;
  }

  switch (ruleType) {
    case GroupRuleType.SimplePayment:
      const symbolElement = currentRule.config.find(e => e.key === "assetSymbol" && e.__typename === "StringKeyValue");
      const symbol = symbolElement ? (symbolElement as any).string : "GHO";
      const amountElement = currentRule.config.find(e => e.key === "amount" && e.__typename === "BigDecimalKeyValue");
      const amount = amountElement ? (amountElement as any).bigDecimal : "0";
      return (
        <div
          className={`flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-gray-700 dark:text-slate-200 ${className}`}
        >
          {" "}
          <DollarSign className="mr-1 h-4 w-4 text-yellow-500" /> {amount} {symbol} required{" "}
        </div>
      );

    case GroupRuleType.TokenGated:
      const tokenSymbolElement = currentRule.config.find(
        e => e.key === "assetSymbol" && e.__typename === "StringKeyValue",
      );
      const tokenSymbol = tokenSymbolElement ? (tokenSymbolElement as any).string : "Token";
      const minAmountElement = currentRule.config.find(e => e.key === "value" && e.__typename === "BigDecimalKeyValue");
      const minAmount = minAmountElement ? (minAmountElement as any).bigDecimal : "1";
      return (
        <div
          className={`flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-gray-700 dark:text-slate-200 ${className}`}
        >
          {" "}
          <KeyRound className="mr-1 h-4 w-4 text-indigo-500" /> {minAmount} {tokenSymbol} required{" "}
        </div>
      );

    case GroupRuleType.MembershipApproval:
      return (
        <div
          className={`flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300 ${className}`}
        >
          {" "}
          <ShieldCheck className="h-5 w-5 text-rose-500" /> Approval required to join{" "}
        </div>
      );

    default:
      return null;
  }
};
