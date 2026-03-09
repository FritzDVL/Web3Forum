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
    
    console.log("🔍 [CreatePostForm] Submit clicked");
    console.log("  Form data:", {
      title: formData.title,
      summary: formData.summary,
      contentLength: formData.content.length,
      tags: tags.length
    });
    
    // Validation
    if (!formData.title.trim()) {
      console.error("❌ [CreatePostForm] Title is empty");
      toast.error("Title Required", { 
        description: "Please enter a title for your post." 
      });
      return;
    }
    
    if (!formData.content.trim()) {
      console.error("❌ [CreatePostForm] Content is empty");
      toast.error("Content Required", { 
        description: "Please write some content for your post." 
      });
      return;
    }
    
    if (formData.content.length < 10) {
      console.error("❌ [CreatePostForm] Content too short");
      toast.error("Content Too Short", { 
        description: "Please write at least 10 characters." 
      });
      return;
    }
    
    if (!account?.address) {
      console.error("❌ [CreatePostForm] No account address");
      toast.error("Authentication Error", { 
        description: "User address not found. Please log in again." 
      });
      return;
    }
    
    if (!sessionClient.data || sessionClient.loading) {
      console.error("❌ [CreatePostForm] Not authenticated");
      toast.error("Authentication Required", { 
        description: "Please sign in to create a post." 
      });
      return;
    }
    
    if (!walletClient.data) {
      console.error("❌ [CreatePostForm] Wallet not connected");
      toast.error("Wallet Connection Required", { 
        description: "Please connect your wallet to create a post." 
      });
      return;
    }

    const loadingToast = toast.loading("Creating post...", { description: "Your post is being created." });
    console.log("🚀 [CreatePostForm] Starting post creation...");
    
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
      
      console.log("📊 [CreatePostForm] Article data prepared");

      const articleResult = await createThreadArticle(
        articleData,
        sessionClient.data,
        walletClient.data,
      );
      
      console.log("📊 [CreatePostForm] Article result:", {
        success: articleResult.success,
        hasPost: !!articleResult.post
      });

      if (!articleResult.success || !articleResult.post) {
        console.error("❌ [CreatePostForm] Article creation failed:", articleResult.error);
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
