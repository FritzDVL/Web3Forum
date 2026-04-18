import { formatThreadArticleContent } from "@/lib/domain/threads/content";
import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { APP_URL } from "@/lib/shared/constants";
import { immutable } from "@lens-chain/storage-client";
import { Post, type SessionClient, evmAddress, uri } from "@lens-protocol/client";
import { postId } from "@lens-protocol/client";
import { editPost, fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { MetadataAttributeType, article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";

export interface ArticleCreationData {
  title: string;
  content: string;
  summary?: string;
  author: string;
  tags?: string;
  feedAddress: string;
  slug: string;
  /** Forum metadata attributes for recovery */
  forumCategory?: string;
  forumType?: string;
  contentJson?: string;
}

export interface ForumReplyArticleData {
  threadTitle: string;
  content: string;
  author: string;
  feedAddress: string;
  slug: string;
  forumThreadId: string;
  forumReplyPosition: number;
  forumCategory?: string;
  contentJson?: string;
}

export interface GroveUploadResult {
  contentUri: string;
}

export interface ArticleCreationResult {
  success: boolean;
  post?: Post;
  error?: string;
}

export interface ArticleUpdateData {
  title: string;
  summary: string;
  content: string;
  tags?: string;
  postId: string;
  feedAddress: string;
  author: string;
  slug: string;
}

export interface ArticleUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Creates an article post for a thread with proper metadata and attributes
 * This function handles the complete article creation process including:
 * - Building metadata with custom attributes
 * - Adding thread content prefix
 * - Uploading to storage
 * - Creating the post on Lens Protocol
 */
export async function createThreadArticle(
  articleData: ArticleCreationData,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<ArticleCreationResult> {
  try {
    // 1. Build article attributes
    const attributes: any[] = [];
    attributes.push({ key: "app", type: MetadataAttributeType.STRING, value: "lensforum" });
    attributes.push({ key: "author", type: MetadataAttributeType.STRING, value: articleData.author });
    if (articleData.summary) {
      attributes.push({ key: "subtitle", type: MetadataAttributeType.STRING, value: articleData.summary });
    }
    if (articleData.forumType) {
      attributes.push({ key: "forumType", type: MetadataAttributeType.STRING, value: articleData.forumType });
    }
    if (articleData.forumCategory) {
      attributes.push({ key: "forumCategory", type: MetadataAttributeType.STRING, value: articleData.forumCategory });
    }
    if (articleData.contentJson) {
      attributes.push({ key: "contentJson", type: MetadataAttributeType.STRING, value: articleData.contentJson });
    }

    // 2. Add thread content prefix with URL, title and summary
    const threadUrl = `${APP_URL}/thread/${articleData.slug}`;
    const contentWithPrefix = formatThreadArticleContent(
      articleData.content,
      threadUrl,
      articleData.title,
      articleData.summary,
    );

    // 3. Build article metadata
    const articleMetadata = article({
      title: articleData.title,
      content: contentWithPrefix,
      tags: articleData.tags ? articleData.tags.split(",").map(tag => tag.trim()) : [],
      attributes,
    });

    // 4. Upload article metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: articleUri } = await storageClient.uploadAsJson(articleMetadata, { acl });

    // 5. Create the post on Lens Protocol
    const postCreationResult = await post(sessionClient, {
      contentUri: uri(articleUri),
      feed: evmAddress(articleData.feedAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (postCreationResult.isErr()) {
      console.error("[Articles] Error creating article post:", postCreationResult.error);
      return {
        success: false,
        error: postCreationResult.error.message,
      };
    }

    const createdPost = postCreationResult.value;

    // 6. Verify it's a Post type, not a Repost
    if (createdPost && createdPost.__typename !== "Post") {
      return {
        success: false,
        error: `Unexpected post type: ${createdPost.__typename}`,
      };
    }

    return {
      success: true,
      post: createdPost as Post,
    };
  } catch (error) {
    console.error("Article creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create article",
    };
  }
}

/**
 * Updates an article post for a thread (root post) on Lens Protocol
 * Handles metadata formatting, storage upload, and Lens update
 */
export async function updateThreadArticle(
  updateData: ArticleUpdateData,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<ArticleUpdateResult> {
  try {
    // 1. Format content with thread prefix
    const threadUrl = `${APP_URL}/thread/${updateData.slug}`;
    const formattedContent = formatThreadArticleContent(
      updateData.content,
      threadUrl,
      updateData.title,
      updateData.summary,
    );

    const attributes: any[] = [];
    attributes.push({ key: "app", type: MetadataAttributeType.STRING, value: "lensforum" });
    attributes.push({ key: "author", type: MetadataAttributeType.STRING, value: updateData.author });
    if (updateData.summary) {
      attributes.push({ key: "subtitle", type: MetadataAttributeType.STRING, value: updateData.summary });
    }

    // 2. Create article metadata
    const metadata = article({
      title: updateData.title,
      content: formattedContent,
      attributes,
      tags: updateData.tags ? updateData.tags.split(",").map(tag => tag.trim()) : [],
    });

    // 3. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: contentUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 4. Update the post on Lens Protocol
    const result = await editPost(sessionClient, {
      post: postId(updateData.postId),
      contentUri: uri(contentUri),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      const errorMessage =
        result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to update thread";
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Thread update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update thread",
    };
  }
}

/**
 * Uploads article metadata to Grove and returns the contentUri.
 * Shared by publish and retry flows.
 */
export async function uploadArticleToGrove(metadata: any): Promise<GroveUploadResult> {
  const acl = immutable(lensChain.id);
  const { uri: contentUri } = await storageClient.uploadAsJson(metadata, { acl });
  return { contentUri };
}

/**
 * Creates a standalone reply article on Lens (NO commentOn).
 * The reply's thread relationship is encoded in metadata attributes only.
 */
export async function createForumReplyArticle(
  data: ForumReplyArticleData,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<ArticleCreationResult> {
  try {
    const displayContent = `Re: ${data.threadTitle} — ${APP_URL}/thread/${data.slug}`;

    const attributes: any[] = [
      { key: "app", type: MetadataAttributeType.STRING, value: "lensforum" },
      { key: "forumType", type: MetadataAttributeType.STRING, value: "reply" },
      { key: "forumThreadId", type: MetadataAttributeType.STRING, value: data.forumThreadId },
      { key: "forumReplyPosition", type: MetadataAttributeType.NUMBER, value: String(data.forumReplyPosition) },
      { key: "author", type: MetadataAttributeType.STRING, value: data.author },
    ];
    if (data.forumCategory) {
      attributes.push({ key: "forumCategory", type: MetadataAttributeType.STRING, value: data.forumCategory });
    }
    if (data.contentJson) {
      attributes.push({ key: "contentJson", type: MetadataAttributeType.STRING, value: data.contentJson });
    }

    const articleMetadata = article({
      title: `Re: ${data.threadTitle}`,
      content: displayContent,
      attributes,
    });

    const { contentUri } = await uploadArticleToGrove(articleMetadata);

    const postResult = await post(sessionClient, {
      contentUri: uri(contentUri),
      feed: evmAddress(data.feedAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (postResult.isErr()) {
      return { success: false, error: postResult.error.message };
    }

    const createdPost = postResult.value;
    if (createdPost && createdPost.__typename !== "Post") {
      return { success: false, error: `Unexpected post type: ${createdPost.__typename}` };
    }

    return { success: true, post: createdPost as Post };
  } catch (error) {
    console.error("Reply article creation failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create reply article" };
  }
}
