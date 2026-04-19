"use client";

import { useState } from "react";
import { CommunityCreationTips } from "@/components/communities/community-creation-tips";
import { CommunityCreateForm } from "@/components/communities/forms/community-create-form";
import { CommunityRulesTips } from "@/components/communities/rules/community-rules-tips";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { BackNavigationLink } from "@/components/ui/back-navigation-link";
import { MembershipApprovalGroupRule, SimplePaymentGroupRule, TokenGatedGroupRule } from "@/lib/domain/rules/types";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/hooks/admin/use-is-admin";

export default function NewCommunityPage() {
  const [groupRule, setGroupRule] = useState<
    SimplePaymentGroupRule | TokenGatedGroupRule | MembershipApprovalGroupRule | undefined
  >(undefined);

  const { account } = useAuthStore();
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Only administrators can create new communities.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header with back button and title */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackNavigationLink href="/communities">Back to Communities</BackNavigationLink>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <CommunityCreateForm onGroupRuleChange={setGroupRule} creator={account ?? undefined} />
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            <CommunityCreationTips />
            {groupRule && <CommunityRulesTips communityRule={groupRule} />}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
