"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MembershipApprovalGroupRule, SimplePaymentGroupRule, TokenGatedGroupRule } from "@/lib/domain/rules/types";

interface CommunityRulesTipsProps {
  communityRule: SimplePaymentGroupRule | TokenGatedGroupRule | MembershipApprovalGroupRule;
}

export function CommunityRulesTips({ communityRule }: CommunityRulesTipsProps) {
  const getRuleInfo = () => {
    switch (communityRule.type) {
      case "SimplePaymentGroupRule":
        return {
          title: "💰 Payment Rule Tips",
          tips: [
            "Set competitive pricing based on your content value",
            "GHO is recommended for stable payments",
            "Remember: Lens deducts 1.5% treasury fee",
          ],
        };
      case "TokenGatedGroupRule":
        return {
          title: "🔐 Token Gate Tips",
          tips: [
            "Double-check token contract address",
            "Set reasonable minimum balance requirements",
            "Popular NFT collections work great",
            "ERC-721 NFTs create exclusive communities",
          ],
        };
      case "MembershipApprovalGroupRule":
        return {
          title: "✋ Manual Approval Tips",
          tips: [
            "Add trusted moderators as approvers",
            "Create clear criteria for membership",
            "You're automatically included as approver",
          ],
        };
      default:
        return null;
    }
  };

  const ruleInfo = getRuleInfo();
  if (!ruleInfo) return null;

  return (
    <Card className="rounded-3xl bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">{ruleInfo.title}</h3>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">
        {ruleInfo.tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>{tip}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
