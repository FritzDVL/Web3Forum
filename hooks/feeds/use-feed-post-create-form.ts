import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { CreateFeedPostFormData } from "@/lib/domain/feeds/types";
import { createFeedPost as createFeedPostService } from "@/lib/services/feed/create-feed-post";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

interface UseFeedPostCreateFormProps {
  feedId: string;
  feedAddress: Address;
}

interface FormErrors {
  title?: string;
  content?: string;
}

interface TouchedFields {
  title: boolean;
  content: boolean;
}

export function useFeedPostCreateForm({ feedId, feedAddress }: UseFeedPostCreateFormProps) {
  const [formData, setFormData] = useState<CreateFeedPostFormData>({
    title: "",
    summary: "",
    content: "",
    tags: "",
    author: "" as Address,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    title: false,
    content: false,
  });

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  // Validation functions
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Title is required";
    }
    return undefined;
  };

  const validateContent = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Content is required";
    }
    return undefined;
  };

  const validateField = (field: keyof FormErrors, value: string) => {
    let error: string | undefined;
    
    if (field === "title") {
      error = validateTitle(value);
    } else if (field === "content") {
      error = validateContent(value);
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const isFormValid = (): boolean => {
    const titleError = validateTitle(formData.title);
    const contentError = validateContent(formData.content);
    return !titleError && !contentError;
  };

  const handleChange = (field: keyof CreateFeedPostFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing (if field was touched)
    if (touched[field as keyof TouchedFields] && errors[field as keyof FormErrors]) {
      validateField(field as keyof FormErrors, value);
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ title: true, content: true });
    
    // Validate all fields
    const titleError = validateTitle(formData.title);
    const contentError = validateContent(formData.content);
    
    setErrors({
      title: titleError,
      content: contentError,
    });
    
    // Stop if validation fails
    if (titleError || contentError) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    
    if (!account?.address) {
      toast.error("Authentication Error", { 
        description: "User address not found. Please log in again." 
      });
      return;
    }
    
    if (!sessionClient.data || sessionClient.loading) {
      toast.error("Authentication Required", { 
        description: "Please sign in to create a post." 
      });
      return;
    }
    
    if (!walletClient.data) {
      toast.error("Wallet Connection Required", { 
        description: "Please connect your wallet to create a post." 
      });
      return;
    }

    const loadingToast = toast.loading("Creating post...", { description: "Your post is being created." });
    
    try {
      setIsCreating(true);

      // Create article directly on client side
      const { createThreadArticle } = await import("@/lib/external/lens/primitives/articles");
      
      const articleData = {
        title: formData.title,
        content: formData.content,
        author: account.address,
        summary: formData.summary,
        tags: tags.length > 0 ? tags.join(",") : undefined,
        feedAddress,
        slug: `${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      };

      const articleResult = await createThreadArticle(
        articleData,
        sessionClient.data,
        walletClient.data,
      );

      if (!articleResult.success || !articleResult.post) {
        throw new Error(articleResult.error || "Failed to create post");
      }

      // Now save to database via server action
      const { saveFeedPost } = await import("@/app/commons/[address]/new-post/actions");
      const saveResult = await saveFeedPost(
        feedId,
        feedAddress,
        articleResult.post.id,
        formData.title,
        formData.content,
        formData.summary,
        account.address
      );

      if (!saveResult.success) {
        console.warn("Failed to save to database:", saveResult.error);
        // Don't fail the whole operation if DB save fails
      }

      toast.success("Post created!", { description: "Your post was successfully created.", id: loadingToast });
      
      // Reset form
      setFormData({ title: "", summary: "", content: "", tags: "", author: account.address });
      setTags([]);
      setTagInput("");
      setErrors({});
      setTouched({ title: false, content: false });
      
      router.push(`/commons/${feedAddress}`);
    } catch (error) {
      toast.error("Failed to create post", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
      console.error("Error creating post:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    formData,
    setFormData,
    tags,
    setTags,
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
