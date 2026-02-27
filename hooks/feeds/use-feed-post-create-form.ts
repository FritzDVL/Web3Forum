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

export function useFeedPostCreateForm({ feedId, feedAddress }: UseFeedPostCreateFormProps) {
  const [formData, setFormData] = useState<CreateFeedPostFormData>({
    title: "",
    summary: "",
    content: "",
    tags: "",
    author: "" as Address,
  });
  const [isCreating, setIsCreating] = useState(false);

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleChange = (field: keyof CreateFeedPostFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account?.address) {
      toast.error("Authentication Error", { description: "User address not found" });
      return;
    }
    
    if (!sessionClient.data || sessionClient.loading) {
      toast.error("Authentication required", { description: "Please sign in to create a post." });
      return;
    }
    
    if (!walletClient.data) {
      toast.error("Connection required", { description: "Please connect your wallet." });
      return;
    }

    const loadingToast = toast.loading("Creating post...", { description: "Your post is being created." });
    
    try {
      setIsCreating(true);

      const formDataToSubmit = new FormData();
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("summary", formData.summary);
      formDataToSubmit.append("content", formData.content);
      formDataToSubmit.append("author", account.address);
      if (tags.length > 0) {
        formDataToSubmit.append("tags", tags.join(","));
      }

      const result = await createFeedPostService(
        feedId,
        feedAddress,
        formDataToSubmit,
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create post");
      }

      toast.success("Post created!", { description: "Your post was successfully created.", id: loadingToast });
      
      // Reset form
      setFormData({ title: "", summary: "", content: "", tags: "", author: account.address });
      setTags([]);
      setTagInput("");
      
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
    handleSubmit,
    isCreating,
  };
}
