import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { ForumBoard } from "@/lib/domain/forum/types";
import { saveForumThread } from "@/lib/services/forum/publish-thread";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

interface FormData {
  title: string;
  summary: string;
  content: string;
}

interface FormErrors {
  title?: string;
  content?: string;
}

interface TouchedFields {
  title: boolean;
  content: boolean;
}

export function useBoardPostCreateForm({ board }: { board: ForumBoard }) {
  const [formData, setFormData] = useState<FormData>({ title: "", summary: "", content: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({ title: false, content: false });

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const validateField = (field: keyof FormErrors, value: string) => {
    const error = !value.trim() ? `${field === "title" ? "Title" : "Content"} is required` : undefined;
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const isFormValid = (): boolean => !(!formData.title.trim() || !formData.content.trim());

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field as keyof TouchedFields] && errors[field as keyof FormErrors]) {
      validateField(field as keyof FormErrors, value);
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ title: true, content: true });
    const titleError = validateField("title", formData.title);
    const contentError = validateField("content", formData.content);
    if (titleError || contentError) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!account?.address || !sessionClient.data || !walletClient.data) {
      toast.error("Please sign in and connect your wallet");
      return;
    }

    const loadingToast = toast.loading("Creating post...");
    setIsCreating(true);

    try {
      // Step 1: Save to Supabase instantly
      const saveResult = await saveForumThread({
        boardSlug: board.slug,
        title: formData.title,
        summary: formData.summary,
        contentMarkdown: formData.content,
        contentJson: null,
        authorAddress: account.address,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (!saveResult.success) throw new Error(saveResult.error || "Failed to save post");

      toast.success("Post created!", { id: loadingToast });

      // Redirect to board page — hard navigation guarantees fresh data
      // Lens on-chain publish happens later via the "Publish on-chain" button in thread view
      window.location.href = `/boards/${board.slug}`;
    } catch (error) {
      toast.error("Failed to create post", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    formData,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    handleChange,
    handleBlur,
    handleSubmit,
    isCreating,
    errors,
    touched,
    isFormValid: isFormValid(),
  };
}
