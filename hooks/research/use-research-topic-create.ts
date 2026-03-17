"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { createResearchThread } from "@/lib/services/research/create-research-thread";
import { toast } from "sonner";
import { ResearchCategory } from "@/lib/domain/research/types";

interface FormErrors {
  title?: string;
  content?: string;
  category?: string;
}

export function useResearchTopicCreate(categories: ResearchCategory[]) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!content.trim()) e.content = "Content is required";
    if (!categorySlug) e.category = "Category is required";
    return e;
  };

  const isFormValid = !validate().title && !validate().content && !validate().category;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setTouched({ title: true, content: true, category: true });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!account?.address || !sessionClient.data || !walletClient.data) {
      toast.error("Please sign in and connect your wallet");
      return;
    }

    const loadingToast = toast.loading("Creating topic...");
    setIsCreating(true);

    try {
      const result = await createResearchThread(
        {
          title,
          content,
          categorySlug,
          tags,
          author: account.address,
        },
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) throw new Error(result.error || "Failed to create topic");

      toast.success("Topic created!", { id: loadingToast });
      router.push(`/research/thread/${result.lensPostId}`);
    } catch (error) {
      toast.error("Failed to create topic", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    title, setTitle,
    content, setContent,
    categorySlug, setCategorySlug,
    tags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown,
    handleBlur, handleSubmit,
    isCreating, errors, touched, isFormValid,
    categories,
  };
}
