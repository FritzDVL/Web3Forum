import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { ForumBoard } from "@/lib/domain/forum/types";
import { saveForumThread } from "@/lib/services/forum/publish-thread";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

const AUTO_PUBLISH_KEY_PREFIX = "lensforum:autopublish:";

interface AutoPublishPayload {
  title: string;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
  boardSlug: string;
  slug: string;
  tags?: string[];
}

function stashAutoPublish(threadId: string, payload: AutoPublishPayload) {
  try {
    sessionStorage.setItem(AUTO_PUBLISH_KEY_PREFIX + threadId, JSON.stringify(payload));
  } catch {}
}

interface FormData {
  title: string;
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
  const [formData, setFormData] = useState<FormData>({ title: "", content: "" });
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

    if (!account?.address) {
      toast.error("Please sign in to create a post");
      return;
    }

    if (!sessionClient.data || !walletClient.data) {
      toast.error("Please connect your wallet");
      return;
    }

    const loadingToast = toast.loading("Creating post...");
    setIsCreating(true);

    try {
      console.log("[CreatePost] Saving to Supabase...", { boardSlug: board.slug, title: formData.title });
      
      // Step 1: Save to Supabase instantly
      const saveResult = await saveForumThread({
        boardSlug: board.slug,
        title: formData.title,
        summary: "",
        contentMarkdown: formData.content,
        contentJson: null,
        authorAddress: account.address,
        tags: tags.length > 0 ? tags : undefined,
      });

      console.log("[CreatePost] Save result:", saveResult);

      if (!saveResult.success) throw new Error(saveResult.error || "Failed to save post");

      toast.success("Post saved! Opening post page to publish on-chain...", { id: loadingToast });

      // Stash the publish payload in sessionStorage. The post detail page
      // will read this on mount and run the Lens publish from there. This
      // avoids the orphaned-promise problem where running publish from the
      // create form (which unmounts on navigation) loses the wallet flow
      // and the follow-up Supabase writes for content_uri / lens_post_id.
      stashAutoPublish(saveResult.threadId!, {
        title: formData.title,
        contentMarkdown: formData.content,
        contentJson: null,
        authorAddress: account.address,
        boardSlug: board.slug,
        slug: saveResult.slug!,
        tags: tags.length > 0 ? tags : undefined,
      });

      router.push(`/boards/${board.slug}/post/${saveResult.slug || saveResult.threadId}`);
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
