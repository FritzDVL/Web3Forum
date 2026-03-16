import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { Board, CreateBoardPostFormData } from "@/lib/domain/boards/types";
import { createBoardPost } from "@/lib/services/board/create-board-post";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

interface FormErrors {
  title?: string;
  content?: string;
}

interface TouchedFields {
  title: boolean;
  content: boolean;
}

export function useBoardPostCreateForm({ board }: { board: Board }) {
  const [formData, setFormData] = useState<CreateBoardPostFormData>({
    title: "",
    summary: "",
    content: "",
    tags: "",
    author: "" as Address,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({ title: false, content: false });

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) return "Title is required";
    return undefined;
  };

  const validateContent = (value: string): string | undefined => {
    if (!value.trim()) return "Content is required";
    return undefined;
  };

  const validateField = (field: keyof FormErrors, value: string) => {
    const error = field === "title" ? validateTitle(value) : validateContent(value);
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const isFormValid = (): boolean => {
    return !validateTitle(formData.title) && !validateContent(formData.content);
  };

  const handleChange = (field: keyof CreateBoardPostFormData, value: string) => {
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
    const titleError = validateTitle(formData.title);
    const contentError = validateContent(formData.content);
    setErrors({ title: titleError, content: contentError });

    if (titleError || contentError) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!account?.address) {
      toast.error("Authentication Error", { description: "Please log in again." });
      return;
    }
    if (!sessionClient.data || sessionClient.loading) {
      toast.error("Authentication Required", { description: "Please sign in to create a post." });
      return;
    }
    if (!walletClient.data) {
      toast.error("Wallet Connection Required", { description: "Please connect your wallet." });
      return;
    }

    const loadingToast = toast.loading("Creating post...");

    try {
      setIsCreating(true);

      const result = await createBoardPost(
        board,
        {
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          tags: tags.length > 0 ? tags.join(",") : undefined,
          author: account.address,
        },
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create post");
      }

      toast.success("Post created!", { id: loadingToast });
      setFormData({ title: "", summary: "", content: "", tags: "", author: account.address });
      setTags([]);
      setTagInput("");
      setErrors({});
      setTouched({ title: false, content: false });
      router.push(`/commons/${board.feedAddress}`);
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
