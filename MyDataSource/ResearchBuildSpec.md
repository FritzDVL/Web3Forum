# Research System Build Spec — Step-by-Step Implementation Guide

**Date:** March 17, 2026
**Branch:** `feature/research-system` (create before starting)
**Prerequisite:** Read `MyDataSource/ResearchPlan.md` (v5) for architectural context

This document is a spec-driven build guide. Each phase lists every file to create, with exact code, exact imports, and exact types. Follow it top to bottom. Commit after each phase.

**Before starting:** User must provide:
- Lens Group address (created by user, owner/admin)
- Lens Feed address (created by user, single Research feed)

---

## PHASE 1: Domain Layer

**Goal:** Define the Research data types. One new file.

**Commit message:** `feat(research): add domain types`

### File 1.1: `lib/domain/research/types.ts` (CREATE)

```typescript
import { Post, Account } from "@lens-protocol/client";

/**
 * One of the 7 research categories (Supabase-only, not a Lens container).
 * Maps to `research_categories` table.
 */
export interface ResearchCategory {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  publicationCount: number;
  viewsCount: number;
}

/**
 * A thread listing item — used on the /research page.
 * Contains the root publication + thread-level metadata.
 */
export interface ResearchThread {
  id: string;
  lensPostId: string;
  post: Post;
  category: ResearchCategory;
  title: string;
  tags: string[];
  totalPosts: number;
  viewsCount: number;
  lastActivityAt: string;
  createdAt: string;
}

/**
 * A single publication within a thread (root or response).
 * All publications are at the same level — root is just #1.
 */
export interface ResearchPublication {
  id: string;
  lensPostId: string;
  rootLensPostId: string | null;
  post: Post;
  postNumber: number;
  isRoot: boolean;
  createdAt: string;
}

/**
 * Form data for creating a new topic (root publication).
 */
export interface CreateResearchTopicFormData {
  title: string;
  content: string;
  categorySlug: string;
  tags: string[];
}

/**
 * Form data for creating a response within a thread.
 */
export interface CreateResearchResponseFormData {
  content: string;
}
```

**Key design decisions:**
- `ResearchThread` is for the listing page — wraps a root `Post` with thread metadata
- `ResearchPublication` is for inside a thread — every post (#1, #2, #3) uses this
- Both preserve the full Lens `Post` object — never destructured
- No separate `ResearchResponse` type — responses are `ResearchPublication` with `isRoot: false`

---

## PHASE 2: Supabase Layer

**Goal:** Create the Supabase data access functions. Two new files.

**Commit message:** `feat(research): add supabase data layer`

### Pre-requisite: Run this SQL in Supabase

```sql
CREATE TABLE research_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  publication_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

CREATE TABLE research_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_post_id TEXT NOT NULL UNIQUE,
  root_lens_post_id TEXT,
  category_slug TEXT NOT NULL REFERENCES research_categories(slug),
  author_address TEXT NOT NULL,
  title TEXT,
  tags TEXT[],
  post_number INTEGER NOT NULL,
  views_count INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 1,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  is_root BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_research_pub_root ON research_publications(root_lens_post_id);
CREATE INDEX idx_research_pub_category ON research_publications(category_slug);
CREATE INDEX idx_research_pub_is_root ON research_publications(is_root);

INSERT INTO research_categories (slug, name, description, display_order) VALUES
  ('architecture', 'General Architecture', 'System design and architecture discussions', 1),
  ('state-machine', 'State Machine', 'State machine design and transitions', 2),
  ('objects', 'Architectural Objects', 'Core objects and data structures', 3),
  ('consensus', 'Consensus', 'Consensus mechanisms and protocols', 4),
  ('cryptography', 'Cryptography', 'Cryptographic primitives and protocols', 5),
  ('account-system', 'Account System', 'Account model and identity', 6),
  ('security', 'Security', 'Security analysis and threat models', 7);
```

### File 2.1: `lib/external/supabase/research-categories.ts` (CREATE)

```typescript
"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface ResearchCategoryRow {
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  publication_count: number;
  views_count: number;
}

export async function fetchAllResearchCategories(): Promise<ResearchCategoryRow[]> {
  const { data, error } = await supabase
    .from("research_categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching research categories:", error);
    return [];
  }
  return data;
}

export async function fetchResearchCategoryBySlug(slug: string): Promise<ResearchCategoryRow | null> {
  const { data, error } = await supabase
    .from("research_categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching research category:", error);
    return null;
  }
  return data;
}

export async function incrementCategoryPublicationCount(slug: string): Promise<void> {
  const { error } = await supabase.rpc("increment_field", {
    table_name: "research_categories",
    field_name: "publication_count",
    row_id: slug,
    id_field: "slug",
  });
  // Fallback if RPC doesn't exist: manual increment
  if (error) {
    const cat = await fetchResearchCategoryBySlug(slug);
    if (cat) {
      await supabase
        .from("research_categories")
        .update({ publication_count: cat.publication_count + 1 })
        .eq("slug", slug);
    }
  }
}
```

### File 2.2: `lib/external/supabase/research-publications.ts` (CREATE)

```typescript
"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface ResearchPublicationRow {
  id: string;
  lens_post_id: string;
  root_lens_post_id: string | null;
  category_slug: string;
  author_address: string;
  title: string | null;
  tags: string[] | null;
  post_number: number;
  views_count: number;
  total_posts: number;
  last_activity_at: string;
  is_root: boolean;
  created_at: string;
}

/** Fetch root publications for the listing page, with optional category filter */
export async function fetchResearchThreads(options?: {
  categorySlug?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<ResearchPublicationRow[]> {
  let query = supabase
    .from("research_publications")
    .select("*")
    .eq("is_root", true)
    .order("last_activity_at", { ascending: false });

  if (options?.categorySlug) {
    query = query.eq("category_slug", options.categorySlug);
  }
  if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching research threads:", error);
    return [];
  }
  return data;
}

/** Fetch a single root publication by its Lens post ID */
export async function fetchResearchRootByLensId(lensPostId: string): Promise<ResearchPublicationRow | null> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("*")
    .eq("lens_post_id", lensPostId)
    .eq("is_root", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching research root:", error);
    return null;
  }
  return data;
}

/** Fetch all publications in a thread (root + responses) ordered by post_number */
export async function fetchResearchPublicationsByRoot(rootLensPostId: string): Promise<ResearchPublicationRow[]> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("*")
    .or(`lens_post_id.eq.${rootLensPostId},root_lens_post_id.eq.${rootLensPostId}`)
    .order("post_number", { ascending: true });

  if (error) {
    console.error("Error fetching research publications:", error);
    return [];
  }
  return data;
}

/** Insert a new publication (root or response) */
export async function persistResearchPublication(params: {
  lensPostId: string;
  rootLensPostId: string | null;
  categorySlug: string;
  authorAddress: string;
  title: string | null;
  tags: string[] | null;
  postNumber: number;
  isRoot: boolean;
}): Promise<ResearchPublicationRow> {
  const { data, error } = await supabase
    .from("research_publications")
    .insert({
      lens_post_id: params.lensPostId,
      root_lens_post_id: params.rootLensPostId,
      category_slug: params.categorySlug,
      author_address: params.authorAddress,
      title: params.title,
      tags: params.tags,
      post_number: params.postNumber,
      is_root: params.isRoot,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to persist research publication: ${error.message}`);
  }
  return data;
}

/** Increment total_posts and update last_activity_at on the root publication */
export async function incrementRootPostCount(rootLensPostId: string): Promise<void> {
  const root = await fetchResearchRootByLensId(rootLensPostId);
  if (!root) return;

  await supabase
    .from("research_publications")
    .update({
      total_posts: root.total_posts + 1,
      last_activity_at: new Date().toISOString(),
    })
    .eq("lens_post_id", rootLensPostId);
}

/** Get the next post number for a thread */
export async function getNextPostNumber(rootLensPostId: string): Promise<number> {
  const { count, error } = await supabase
    .from("research_publications")
    .select("*", { count: "exact", head: true })
    .or(`lens_post_id.eq.${rootLensPostId},root_lens_post_id.eq.${rootLensPostId}`);

  if (error) {
    console.error("Error getting next post number:", error);
    return 1;
  }
  return (count || 0) + 1;
}

/** Increment views on a root publication */
export async function incrementResearchViews(lensPostId: string): Promise<void> {
  const root = await fetchResearchRootByLensId(lensPostId);
  if (!root) return;

  await supabase
    .from("research_publications")
    .update({ views_count: root.views_count + 1 })
    .eq("lens_post_id", lensPostId);
}

/** Fetch all unique tags across all publications */
export async function fetchAllResearchTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from("research_publications")
    .select("tags")
    .eq("is_root", true)
    .not("tags", "is", null);

  if (error) {
    console.error("Error fetching research tags:", error);
    return [];
  }

  const allTags = new Set<string>();
  data.forEach((row) => {
    if (row.tags) row.tags.forEach((tag: string) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}
```

---

## PHASE 3: Adapter Layer

**Goal:** Pure functions to convert Supabase rows + Lens Posts into domain types.

**Commit message:** `feat(research): add adapter layer`

### File 3.1: `lib/adapters/research-adapter.ts` (CREATE)

```typescript
import { ResearchCategory, ResearchThread, ResearchPublication } from "@/lib/domain/research/types";
import { ResearchCategoryRow } from "@/lib/external/supabase/research-categories";
import { ResearchPublicationRow } from "@/lib/external/supabase/research-publications";
import { Post } from "@lens-protocol/client";

/**
 * Converts a Supabase research_categories row into a ResearchCategory domain object.
 */
export function adaptRowToCategory(row: ResearchCategoryRow): ResearchCategory {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    displayOrder: row.display_order,
    publicationCount: row.publication_count,
    viewsCount: row.views_count,
  };
}

/**
 * Converts a Supabase root publication row + Lens Post + category into a ResearchThread.
 * Used on the /research listing page.
 */
export function adaptToThread(
  row: ResearchPublicationRow,
  lensPost: Post,
  category: ResearchCategory,
): ResearchThread {
  return {
    id: row.id,
    lensPostId: row.lens_post_id,
    post: lensPost,
    category,
    title: row.title || getArticleTitle(lensPost),
    tags: row.tags || [],
    totalPosts: row.total_posts,
    viewsCount: row.views_count,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  };
}

/**
 * Converts a Supabase publication row + Lens Post into a ResearchPublication.
 * Used inside a thread page — all posts (#1, #2, #3) use this.
 */
export function adaptToPublication(
  row: ResearchPublicationRow,
  lensPost: Post,
): ResearchPublication {
  return {
    id: row.id,
    lensPostId: row.lens_post_id,
    rootLensPostId: row.root_lens_post_id,
    post: lensPost,
    postNumber: row.post_number,
    isRoot: row.is_root,
    createdAt: row.created_at,
  };
}

/** Extract title from ArticleMetadata, fallback to first words of content */
function getArticleTitle(post: Post): string {
  if (post.metadata.__typename === "ArticleMetadata" && post.metadata.title) {
    return post.metadata.title;
  }
  const content = (post.metadata as any)?.content || "";
  return content.split(" ").slice(0, 8).join(" ") + "..." || "Untitled";
}
```

---

## PHASE 4: Service Layer

**Goal:** 5 service files that orchestrate Lens + Supabase calls.

**Commit message:** `feat(research): add service layer`

### File 4.1: `lib/services/research/get-research-categories.ts` (CREATE)

```typescript
"use server";

import { ResearchCategory } from "@/lib/domain/research/types";
import { adaptRowToCategory } from "@/lib/adapters/research-adapter";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";

export interface GetResearchCategoriesResult {
  success: boolean;
  categories?: ResearchCategory[];
  error?: string;
}

export async function getResearchCategories(): Promise<GetResearchCategoriesResult> {
  try {
    const rows = await fetchAllResearchCategories();
    return { success: true, categories: rows.map(adaptRowToCategory) };
  } catch (error) {
    console.error("Failed to fetch research categories:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch categories" };
  }
}
```

### File 4.2: `lib/services/research/get-research-threads.ts` (CREATE)

```typescript
"use server";

import { ResearchThread, ResearchCategory } from "@/lib/domain/research/types";
import { adaptRowToCategory, adaptToThread } from "@/lib/adapters/research-adapter";
import { fetchResearchThreads, ResearchPublicationRow } from "@/lib/external/supabase/research-publications";
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";
import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { Post } from "@lens-protocol/client";

export interface GetResearchThreadsResult {
  success: boolean;
  threads?: ResearchThread[];
  error?: string;
}

export async function getResearchThreads(options?: {
  categorySlug?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<GetResearchThreadsResult> {
  try {
    // 1. Fetch root publication rows from Supabase
    const rows = await fetchResearchThreads({
      categorySlug: options?.categorySlug,
      tag: options?.tag,
      limit: options?.limit || 20,
      offset: options?.offset,
    });

    if (rows.length === 0) {
      return { success: true, threads: [] };
    }

    // 2. Batch fetch Lens Posts for all roots
    const lensPostIds = rows.map((r) => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(lensPostIds);
    const postMap = new Map<string, Post>(lensPosts.map((p) => [p.id, p]));

    // 3. Fetch all categories for lookup
    const catRows = await fetchAllResearchCategories();
    const catMap = new Map(catRows.map((c) => [c.slug, adaptRowToCategory(c)]));

    // 4. Assemble threads (skip any where Lens post is missing)
    const threads: ResearchThread[] = [];
    for (const row of rows) {
      const lensPost = postMap.get(row.lens_post_id);
      const category = catMap.get(row.category_slug);
      if (lensPost && category) {
        threads.push(adaptToThread(row, lensPost, category));
      }
    }

    return { success: true, threads };
  } catch (error) {
    console.error("Failed to fetch research threads:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch threads" };
  }
}
```

### File 4.3: `lib/services/research/get-research-thread.ts` (CREATE)

This is the key service — fetches a single thread with ALL its publications (flat).

```typescript
"use server";

import { ResearchThread, ResearchPublication, ResearchCategory } from "@/lib/domain/research/types";
import { adaptRowToCategory, adaptToThread, adaptToPublication } from "@/lib/adapters/research-adapter";
import {
  fetchResearchRootByLensId,
  fetchResearchPublicationsByRoot,
} from "@/lib/external/supabase/research-publications";
import { fetchResearchCategoryBySlug } from "@/lib/external/supabase/research-categories";
import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { Post } from "@lens-protocol/client";

export interface GetResearchThreadResult {
  success: boolean;
  thread?: ResearchThread;
  publications?: ResearchPublication[];
  error?: string;
}

export async function getResearchThread(rootLensPostId: string): Promise<GetResearchThreadResult> {
  try {
    // 1. Fetch root row from Supabase
    const rootRow = await fetchResearchRootByLensId(rootLensPostId);
    if (!rootRow) {
      return { success: false, error: "Thread not found" };
    }

    // 2. Fetch all publication rows in this thread (root + responses)
    const allRows = await fetchResearchPublicationsByRoot(rootLensPostId);

    // 3. Batch fetch all Lens Posts
    const lensPostIds = allRows.map((r) => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(lensPostIds);
    const postMap = new Map<string, Post>(lensPosts.map((p) => [p.id, p]));

    // 4. Fetch category
    const catRow = await fetchResearchCategoryBySlug(rootRow.category_slug);
    if (!catRow) {
      return { success: false, error: "Category not found" };
    }
    const category = adaptRowToCategory(catRow);

    // 5. Build thread header from root
    const rootPost = postMap.get(rootRow.lens_post_id);
    if (!rootPost) {
      return { success: false, error: "Root post not found on Lens" };
    }
    const thread = adaptToThread(rootRow, rootPost, category);

    // 6. Build flat publication list (all posts including root)
    const publications: ResearchPublication[] = [];
    for (const row of allRows) {
      const lensPost = postMap.get(row.lens_post_id);
      if (lensPost) {
        publications.push(adaptToPublication(row, lensPost));
      }
    }

    return { success: true, thread, publications };
  } catch (error) {
    console.error("Failed to fetch research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch thread" };
  }
}
```

### File 4.4: `lib/services/research/create-research-thread.ts` (CREATE)

Creates a new topic (root publication).

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import {
  persistResearchPublication,
} from "@/lib/external/supabase/research-publications";
import { incrementCategoryPublicationCount } from "@/lib/external/supabase/research-categories";
import { RESEARCH_FEED_ADDRESS } from "@/lib/shared/constants";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface CreateResearchThreadResult {
  success: boolean;
  lensPostId?: string;
  error?: string;
}

export async function createResearchThread(
  formData: {
    title: string;
    content: string;
    categorySlug: string;
    tags: string[];
    author: string;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchThreadResult> {
  try {
    // 1. Create article on Lens
    const articleResult = await createThreadArticle(
      {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        summary: "",
        tags: formData.tags.join(","),
        feedAddress: RESEARCH_FEED_ADDRESS,
        slug: `research-${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      },
      sessionClient,
      walletClient,
    );

    if (!articleResult.success || !articleResult.post) {
      return { success: false, error: articleResult.error || "Failed to create article on Lens" };
    }

    // 2. Persist to Supabase
    await persistResearchPublication({
      lensPostId: articleResult.post.id,
      rootLensPostId: null,
      categorySlug: formData.categorySlug,
      authorAddress: formData.author,
      title: formData.title,
      tags: formData.tags.length > 0 ? formData.tags : null,
      postNumber: 1,
      isRoot: true,
    });

    // 3. Increment category count
    await incrementCategoryPublicationCount(formData.categorySlug);

    // 4. Revalidate
    revalidatePath("/research");
    revalidatePath("/");

    return { success: true, lensPostId: articleResult.post.id };
  } catch (error) {
    console.error("Failed to create research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create thread" };
  }
}
```

### File 4.5: `lib/services/research/create-research-response.ts` (CREATE)

Creates a response within a thread (commentOn root).

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { RESEARCH_FEED_ADDRESS } from "@/lib/shared/constants";
import {
  persistResearchPublication,
  incrementRootPostCount,
  getNextPostNumber,
  fetchResearchRootByLensId,
} from "@/lib/external/supabase/research-publications";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, uri } from "@lens-protocol/client";
import { postId } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";

export interface CreateResearchResponseResult {
  success: boolean;
  lensPostId?: string;
  error?: string;
}

export async function createResearchResponse(
  rootLensPostId: string,
  content: string,
  authorAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchResponseResult> {
  try {
    // 1. Verify root exists
    const rootRow = await fetchResearchRootByLensId(rootLensPostId);
    if (!rootRow) {
      return { success: false, error: "Thread not found" };
    }

    // 2. Create article metadata (full rich content, same as root)
    const metadata = article({ content });

    // 3. Upload metadata
    const acl = immutable(lensChain.id);
    const { uri: contentUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 4. Post to Lens with commentOn (links to root, flat)
    const result = await post(sessionClient, {
      contentUri: uri(contentUri),
      commentOn: { post: postId(rootLensPostId) },
      feed: evmAddress(RESEARCH_FEED_ADDRESS),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      const errorMessage =
        result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to create response";
      return { success: false, error: errorMessage };
    }

    const createdPost = result.value as Post;

    // 5. Get next post number and persist to Supabase
    const nextNumber = await getNextPostNumber(rootLensPostId);

    await persistResearchPublication({
      lensPostId: createdPost.id,
      rootLensPostId,
      categorySlug: rootRow.category_slug,
      authorAddress,
      title: null,
      tags: null,
      postNumber: nextNumber,
      isRoot: false,
    });

    // 6. Increment root's total_posts and update last_activity_at
    await incrementRootPostCount(rootLensPostId);

    // 7. Revalidate
    revalidatePath(`/research/thread/${rootLensPostId}`);
    revalidatePath("/research");

    return { success: true, lensPostId: createdPost.id };
  } catch (error) {
    console.error("Failed to create research response:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create response" };
  }
}
```

### File 4.6: `lib/shared/constants.ts` (UPDATE)

Add the Research Feed and Group addresses. **Replace `TODO_REPLACE` with actual addresses once created.**

```typescript
// Add these lines to the existing constants file:
export const RESEARCH_GROUP_ADDRESS = "TODO_REPLACE_WITH_GROUP_ADDRESS";
export const RESEARCH_FEED_ADDRESS = "TODO_REPLACE_WITH_FEED_ADDRESS";
```

---

## PHASE 5: Hooks

**Goal:** Client-side hooks for creating topics and responses.

**Commit message:** `feat(research): add hooks`

### File 5.1: `hooks/research/use-research-topic-create.ts` (CREATE)

```typescript
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
```

### File 5.2: `hooks/research/use-research-response-create.ts` (CREATE)

```typescript
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { createResearchResponse } from "@/lib/services/research/create-research-response";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useResearchResponseCreate(rootLensPostId: string) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (!account?.address || !sessionClient.data || !walletClient.data) {
      toast.error("Please sign in and connect your wallet");
      return;
    }

    const loadingToast = toast.loading("Posting response...");
    setIsSubmitting(true);

    try {
      const result = await createResearchResponse(
        rootLensPostId,
        content,
        account.address,
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) throw new Error(result.error || "Failed to post response");

      toast.success("Response posted!", { id: loadingToast });
      setContent("");
      setEditorKey((prev) => prev + 1);
      router.refresh();
    } catch (error) {
      toast.error("Failed to post response", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Called by the Quote button — prepends a blockquote to the current content */
  const insertQuote = (text: string, authorName: string) => {
    const quotedLines = text.split("\n").map((line) => `> ${line}`).join("\n");
    const quote = `> **@${authorName}** wrote:\n${quotedLines}\n\n`;
    setContent((prev) => quote + prev);
    setEditorKey((prev) => prev + 1);
  };

  return {
    content, setContent,
    isSubmitting, editorKey,
    handleSubmit, insertQuote,
  };
}
```

---

## PHASE 6: Components

**Goal:** 8 new components for the Research UI.

**Commit message:** `feat(research): add components`

### File 6.1: `components/research/research-nav-actions.tsx` (CREATE)

```typescript
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface ResearchNavActionsProps {
  showNewTopic?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function ResearchNavActions({
  showNewTopic = true,
  backHref,
  backLabel = "Back",
}: ResearchNavActionsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      {backHref ? (
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {showNewTopic && (
        <Link href="/research/new">
          <Button size="sm" className="gradient-button">
            <Plus className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </Link>
      )}
    </div>
  );
}
```

### File 6.2: `components/research/research-sort-filter.tsx` (CREATE)

```typescript
"use client";

import { ResearchCategory } from "@/lib/domain/research/types";

interface ResearchSortFilterProps {
  categories: ResearchCategory[];
  activeCategory: string | null;
  activeTag: string | null;
  allTags: string[];
  onCategoryChange: (slug: string | null) => void;
  onTagChange: (tag: string | null) => void;
}

export function ResearchSortFilter({
  categories,
  activeCategory,
  activeTag,
  allTags,
  onCategoryChange,
  onTagChange,
}: ResearchSortFilterProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => onCategoryChange(cat.slug === activeCategory ? null : cat.slug)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === cat.slug
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeTag && (
            <button
              onClick={() => onTagChange(null)}
              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              #{activeTag} ✕
            </button>
          )}
          {!activeTag &&
            allTags.slice(0, 15).map((tag) => (
              <button
                key={tag}
                onClick={() => onTagChange(tag)}
                className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
```

### File 6.3: `components/research/research-thread-card.tsx` (CREATE)

```typescript
import Link from "next/link";
import { ResearchThread } from "@/lib/domain/research/types";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { MessageSquare, Eye } from "lucide-react";
import { getTimeAgo } from "@/lib/shared/utils";

interface ResearchThreadCardProps {
  thread: ResearchThread;
}

export function ResearchThreadCard({ thread }: ResearchThreadCardProps) {
  const author = thread.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const timeAgo = getTimeAgo(new Date(thread.createdAt));

  return (
    <Link
      href={`/research/thread/${thread.lensPostId}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
    >
      <div className="flex items-start gap-4">
        <AvatarProfileLink author={author} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
            {thread.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>by @{authorName}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            <span>·</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {thread.category.name}
            </span>
          </div>
          {thread.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-gray-700 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.totalPosts} {thread.totalPosts === 1 ? "post" : "posts"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{thread.viewsCount} views</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### File 6.4: `components/research/research-thread-list.tsx` (CREATE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { ResearchThread, ResearchCategory } from "@/lib/domain/research/types";
import { ResearchThreadCard } from "./research-thread-card";
import { ResearchSortFilter } from "./research-sort-filter";
import { getResearchThreads } from "@/lib/services/research/get-research-threads";
import { Button } from "@/components/ui/button";

interface ResearchThreadListProps {
  initialThreads: ResearchThread[];
  categories: ResearchCategory[];
  allTags: string[];
}

export function ResearchThreadList({ initialThreads, categories, allTags }: ResearchThreadListProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function refetch() {
      setLoading(true);
      const result = await getResearchThreads({
        categorySlug: activeCategory || undefined,
        tag: activeTag || undefined,
        limit: 20,
      });
      if (result.success && result.threads) {
        setThreads(result.threads);
      }
      setLoading(false);
    }
    // Only refetch when filters change (not on initial mount)
    if (activeCategory !== null || activeTag !== null) {
      refetch();
    } else {
      setThreads(initialThreads);
    }
  }, [activeCategory, activeTag, initialThreads]);

  return (
    <div>
      <ResearchSortFilter
        categories={categories}
        activeCategory={activeCategory}
        activeTag={activeTag}
        allTags={allTags}
        onCategoryChange={setActiveCategory}
        onTagChange={setActiveTag}
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No topics yet. Be the first to start a discussion!
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ResearchThreadCard key={thread.lensPostId} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### File 6.5: `components/research/research-post.tsx` (CREATE)

This is the core component — renders a single post in a thread. All posts (#1, #2, #3) use this. Visually identical.

```typescript
"use client";

import { ResearchPublication } from "@/lib/domain/research/types";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { ReplyVoting } from "@/components/reply/reply-voting";
import { getReplyContent } from "@/lib/domain/replies/content";
import { stripThreadArticleFormatting } from "@/lib/domain/threads/content";
import { getTimeAgo } from "@/lib/shared/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { postId } from "@lens-protocol/client";

interface ResearchPostProps {
  publication: ResearchPublication;
  onReply: (quotedText: string, authorName: string) => void;
}

export function ResearchPost({ publication, onReply }: ResearchPostProps) {
  const author = publication.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const timeAgo = getTimeAgo(new Date(publication.createdAt));

  // Extract content — handle both root (ArticleMetadata with prefix) and responses
  const { content, image, video } = getReplyContent(publication.post);

  const handleReply = () => {
    // Quote first ~300 chars of this post's content
    const quoteText = content.slice(0, 300) + (content.length > 300 ? "..." : "");
    onReply(quoteText, authorName);
  };

  return (
    <div className="border-b border-slate-200 p-6 last:border-b-0 dark:border-gray-700" id={`post-${publication.postNumber}`}>
      <div className="flex items-start gap-4">
        {/* Voting */}
        <div className="flex flex-col items-center pt-1">
          <ReplyVoting postid={postId(publication.lensPostId)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Author row */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvatarProfileLink author={author} />
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {author.metadata?.name || authorName}
                </span>
                <span className="ml-2 text-sm text-gray-500">@{authorName}</span>
              </div>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">{timeAgo}</span>
            </div>
            <span className="text-sm font-medium text-gray-400">#{publication.postNumber}</span>
          </div>

          {/* Content */}
          <ContentRenderer
            content={{ content, image, video }}
            className="prose prose-slate max-w-none dark:prose-invert"
          />

          {/* Actions */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              Reply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### File 6.6: `components/research/research-post-list.tsx` (CREATE)

```typescript
import { ResearchPublication } from "@/lib/domain/research/types";
import { ResearchPost } from "./research-post";

interface ResearchPostListProps {
  publications: ResearchPublication[];
  onReply: (quotedText: string, authorName: string) => void;
}

export function ResearchPostList({ publications, onReply }: ResearchPostListProps) {
  if (publications.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">No posts yet.</div>
    );
  }

  return (
    <div>
      {publications.map((pub) => (
        <ResearchPost key={pub.lensPostId} publication={pub} onReply={onReply} />
      ))}
    </div>
  );
}
```

### File 6.7: `components/research/research-reply-editor.tsx` (CREATE)

The reply editor at the bottom of every thread page. Full TextEditor. Receives quote insertions from the Reply buttons above.

```typescript
"use client";

import { useAuthStore } from "@/stores/auth-store";
import { TextEditor } from "@/components/editor/text-editor";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ResearchReplyEditorProps {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  editorKey: number;
}

export function ResearchReplyEditor({
  content,
  onContentChange,
  onSubmit,
  isSubmitting,
  editorKey,
}: ResearchReplyEditorProps) {
  const { isLoggedIn, account } = useAuthStore();

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign in to participate in this discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 p-6 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={account?.metadata?.picture} />
          <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {account?.username?.localName?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-3">
          <TextEditor
            key={editorKey}
            onChange={onContentChange}
            initialValue={content}
          />
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!content.trim() || isSubmitting}
              className="gradient-button"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Posting..." : "Post Response"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### File 6.8: `components/research/research-topic-create-form.tsx` (CREATE)

```typescript
"use client";

import { ResearchCategory } from "@/lib/domain/research/types";
import { useResearchTopicCreate } from "@/hooks/research/use-research-topic-create";
import { TextEditor } from "@/components/editor/text-editor";
import { TagsInput } from "@/components/ui/tags-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface ResearchTopicCreateFormProps {
  categories: ResearchCategory[];
}

export function ResearchTopicCreateForm({ categories }: ResearchTopicCreateFormProps) {
  const {
    title, setTitle,
    content, setContent,
    categorySlug, setCategorySlug,
    tags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown,
    handleBlur, handleSubmit,
    isCreating, errors, touched, isFormValid,
  } = useResearchTopicCreate(categories);

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">New Research Topic</h1>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="What is this research about?"
              className={touched.title && errors.title ? "border-red-500" : ""}
            />
            {touched.title && errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategorySlug(cat.slug)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    categorySlug === cat.slug
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {touched.category && errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>
              Content <span className="text-red-500">*</span>
            </Label>
            <div
              className={`rounded-2xl border backdrop-blur-sm dark:bg-gray-800 ${
                touched.content && errors.content
                  ? "border-red-500 bg-red-50/50"
                  : "border-brand-200/40 bg-white/50"
              }`}
              onBlur={() => handleBlur("content")}
            >
              <TextEditor onChange={setContent} />
            </div>
            {touched.content && errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              Tags (optional) {tags.length > 0 && <span className="text-slate-500">({tags.length}/5)</span>}
            </Label>
            <TagsInput
              tags={tags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              removeTag={removeTag}
              handleTagInputKeyDown={handleTagInputKeyDown}
              maxTags={5}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isCreating || !isFormValid} className="gap-2">
              <Send className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Topic"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## PHASE 7: Routes

**Goal:** 3 route pages for the Research section.

**Commit message:** `feat(research): add route pages`

### File 7.1: `app/research/page.tsx` (CREATE)

The main Research listing page. Shows all threads sorted by recent activity, with category/tag filters.

```typescript
import { getResearchThreads } from "@/lib/services/research/get-research-threads";
import { getResearchCategories } from "@/lib/services/research/get-research-categories";
import { fetchAllResearchTags } from "@/lib/external/supabase/research-publications";
import { ResearchNavActions } from "@/components/research/research-nav-actions";
import { ResearchThreadList } from "@/components/research/research-thread-list";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const [threadsResult, categoriesResult, allTags] = await Promise.all([
    getResearchThreads({ limit: 20 }),
    getResearchCategories(),
    fetchAllResearchTags(),
  ]);

  const threads = threadsResult.success ? (threadsResult.threads || []) : [];
  const categories = categoriesResult.success ? (categoriesResult.categories || []) : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
          Society Protocol Research
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Technical research and discussion
        </p>
      </div>

      <ResearchNavActions />
      <ResearchThreadList
        initialThreads={threads}
        categories={categories}
        allTags={allTags}
      />
    </div>
  );
}
```

### File 7.2: `app/research/new/page.tsx` (CREATE)

Create new topic page. Protected — requires login.

```typescript
import { getResearchCategories } from "@/lib/services/research/get-research-categories";
import { ResearchTopicCreateForm } from "@/components/research/research-topic-create-form";
import { ResearchNavActions } from "@/components/research/research-nav-actions";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { StatusBanner } from "@/components/shared/status-banner";

export default async function NewResearchTopicPage() {
  const categoriesResult = await getResearchCategories();

  if (!categoriesResult.success || !categoriesResult.categories?.length) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Error" message="Failed to load categories." />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ResearchNavActions backHref="/research" backLabel="Back to Research" showNewTopic={false} />
        <ResearchTopicCreateForm categories={categoriesResult.categories} />
      </div>
    </ProtectedRoute>
  );
}
```

### File 7.3: `app/research/thread/[threadId]/page.tsx` (CREATE)

Thread detail page — shows all posts flat with reply editor at bottom.

```typescript
import { getResearchThread } from "@/lib/services/research/get-research-thread";
import { StatusBanner } from "@/components/shared/status-banner";
import { ResearchNavActions } from "@/components/research/research-nav-actions";
import { ResearchThreadView } from "@/components/research/research-thread-view";

export const dynamic = "force-dynamic";

export default async function ResearchThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const result = await getResearchThread(threadId);

  if (!result.success || !result.thread || !result.publications) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="error"
            title="Thread not found"
            message={result.error || "The requested thread does not exist."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ResearchNavActions backHref="/research" backLabel="Back to Research" showNewTopic={false} />
      <ResearchThreadView thread={result.thread} publications={result.publications} />
    </div>
  );
}
```

### File 7.4: `components/research/research-thread-view.tsx` (CREATE)

Client component that wires together the thread header, post list, and reply editor. This is where the quote-reply flow lives.

```typescript
"use client";

import { useRef } from "react";
import { ResearchThread, ResearchPublication } from "@/lib/domain/research/types";
import { ResearchPostList } from "./research-post-list";
import { ResearchReplyEditor } from "./research-reply-editor";
import { useResearchResponseCreate } from "@/hooks/research/use-research-response-create";
import { Eye, MessageSquare } from "lucide-react";

interface ResearchThreadViewProps {
  thread: ResearchThread;
  publications: ResearchPublication[];
}

export function ResearchThreadView({ thread, publications }: ResearchThreadViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const {
    content, setContent,
    isSubmitting, editorKey,
    handleSubmit, insertQuote,
  } = useResearchResponseCreate(thread.lensPostId);

  const handleReply = (quotedText: string, authorName: string) => {
    insertQuote(quotedText, authorName);
    // Scroll to editor
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div>
      {/* Thread header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
          {thread.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {thread.category.name}
          </span>
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-gray-700 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {thread.totalPosts} posts
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {thread.viewsCount} views
          </span>
        </div>
      </div>

      {/* All posts — flat, same level */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <ResearchPostList publications={publications} onReply={handleReply} />

        {/* Reply editor at bottom */}
        <div ref={editorRef}>
          <ResearchReplyEditor
            content={content}
            onContentChange={setContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            editorKey={editorKey}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 8: Homepage Integration

**Goal:** Replace the technical section on the homepage with research categories linking to `/research`.

**Commit message:** `feat(research): integrate with homepage`

### File 8.1: `lib/services/board/get-boards.ts` (UPDATE)

The technical section currently reads from the `feeds` table. We replace it with `research_categories`.

Change the `getBoardSections` function to exclude the `technical` category from the board sections, and add a new function for the research section:

```typescript
// Add this import at the top:
import { fetchAllResearchCategories } from "@/lib/external/supabase/research-categories";

// Add this new interface:
export interface ResearchSection {
  sectionTitle: string;
  categories: Array<{
    slug: string;
    name: string;
    description: string;
    publicationCount: number;
    viewsCount: number;
  }>;
  borderColor: string;
  isLocked: boolean;
}

// Add this new function:
export async function getResearchSection(): Promise<ResearchSection | null> {
  const rows = await fetchAllResearchCategories();
  if (rows.length === 0) return null;

  return {
    sectionTitle: "SOCIETY PROTOCOL TECHNICAL SECTION",
    categories: rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description || "",
      publicationCount: r.publication_count,
      viewsCount: r.views_count,
    })),
    borderColor: "blue",
    isLocked: true,
  };
}
```

In `getBoardSections`, change the categories array to exclude `technical`:

```typescript
// Change this line:
const categories = ["general", "functions", "others", "technical", "partners"];

// To:
const categories = ["general", "functions", "others", "partners"];
```

### File 8.2: `components/home/research-category-list.tsx` (CREATE)

New homepage component that renders the 7 research categories linking to `/research`.

```typescript
import Link from "next/link";
import { Lock } from "lucide-react";
import { ResearchSection } from "@/lib/services/board/get-boards";

interface ResearchCategoryListProps {
  section: ResearchSection;
}

export function ResearchCategoryList({ section }: ResearchCategoryListProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-yellow-600/50 bg-[#1a1b4b]">
      {/* Header */}
      <div className="border-l-4 border-blue-600 bg-[#252663] px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-100">
            {section.sectionTitle}
          </h3>
        </div>
      </div>

      {/* Category List */}
      <div className="divide-y divide-slate-600/50">
        {section.categories.map((cat) => (
          <Link
            key={cat.slug}
            href="/research"
            className="block transition-colors hover:bg-[#252663]"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-yellow-400">{cat.name}</h4>
                <p className="mt-1 text-xs text-slate-300">{cat.description}</p>
              </div>
              <div className="hidden items-center gap-8 md:flex ml-4">
                <div className="min-w-[60px] text-center">
                  <div className="text-xs text-slate-400">Topics</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {cat.publicationCount.toLocaleString()}
                  </div>
                </div>
                <div className="min-w-[60px] text-center">
                  <div className="text-xs text-slate-400">Views</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {cat.viewsCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### File 8.3: `app/page.tsx` (UPDATE)

Add the research section to the homepage, in the same position where the technical board section used to appear.

```typescript
import { CommunityGrid } from "@/components/home/community-grid";
import { ForumCategory } from "@/components/home/forum-category";
import { FunctionGrid } from "@/components/home/function-grid";
import { ResearchCategoryList } from "@/components/home/research-category-list";
import { getFeaturedCommunities } from "@/lib/services/community/get-featured-communities";
import { getBoardSections, getResearchSection } from "@/lib/services/board/get-boards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [boardSections, researchSection, featuredCommunitiesResult] = await Promise.all([
    getBoardSections(),
    getResearchSection(),
    getFeaturedCommunities(),
  ]);

  const featuredCommunities = featuredCommunitiesResult.success
    ? (featuredCommunitiesResult.communities ?? [])
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-12">
        {/* Board Sections (general, functions, others, partners — no technical) */}
        {boardSections.map((section) => (
          <div key={section.sectionTitle} className="w-full max-w-5xl">
            {section.layout === "grid" ? (
              <FunctionGrid
                title={section.sectionTitle}
                feeds={section.feeds}
                borderColor={section.borderColor}
              />
            ) : (
              <ForumCategory
                title={section.sectionTitle}
                feeds={section.feeds}
                borderColor={section.borderColor}
                isLocked={section.isLocked}
              />
            )}
          </div>
        ))}

        {/* Research Section (replaces technical boards) */}
        {researchSection && (
          <div className="w-full max-w-5xl">
            <ResearchCategoryList section={researchSection} />
          </div>
        )}

        {/* Featured Communities */}
        <div className="w-full max-w-5xl">
          <h2 className="mb-8 text-left text-xl font-bold text-slate-900 dark:text-gray-100">
            LOCAL
          </h2>
          <CommunityGrid communities={featuredCommunities} />
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 9: Editor Improvements

**Goal:** Fix ContentRenderer for GFM and uncomment table support.

**Commit message:** `fix(editor): add remarkGfm to ContentRenderer and enable tables`

### File 9.1: `components/shared/content-renderer.tsx` (UPDATE)

Add `remarkGfm` to the ReactMarkdown plugins:

```typescript
// Add import:
import remarkGfm from "remark-gfm";

// Change the ReactMarkdown line from:
<ReactMarkdown remarkPlugins={[remarkBreaks]}>

// To:
<ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
```

### File 9.2: `components/editor/slash-menu.tsx` (UPDATE)

Uncomment the table slash menu item:

```typescript
// Uncomment this line:
<SlashMenuItem label="Table" onSelect={() => editor.commands.insertTable({ row: 3, col: 3 })} />
```

---

## PHASE 10: Revalidation Helpers

**Goal:** Add revalidation paths for research routes.

**Commit message:** `feat(research): add revalidation helpers`

### File 10.1: `app/actions/revalidate-path.ts` (UPDATE)

Add these functions to the existing file:

```typescript
export async function revalidateResearchPath() {
  revalidatePath("/research");
}

export async function revalidateResearchThreadPath(threadId: string) {
  revalidatePath(`/research/thread/${threadId}`);
}
```

---

## PHASE 11: View Tracking API

**Goal:** Add an API route for tracking research thread views.

**Commit message:** `feat(research): add view tracking`

### File 11.1: `app/api/research/[threadId]/view/route.ts` (CREATE)

```typescript
import { incrementResearchViews } from "@/lib/external/supabase/research-publications";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    await incrementResearchViews(threadId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

---

## Summary: All Files

### New files (22)

| # | File | Phase |
|---|------|-------|
| 1 | `lib/domain/research/types.ts` | 1 |
| 2 | `lib/external/supabase/research-categories.ts` | 2 |
| 3 | `lib/external/supabase/research-publications.ts` | 2 |
| 4 | `lib/adapters/research-adapter.ts` | 3 |
| 5 | `lib/services/research/get-research-categories.ts` | 4 |
| 6 | `lib/services/research/get-research-threads.ts` | 4 |
| 7 | `lib/services/research/get-research-thread.ts` | 4 |
| 8 | `lib/services/research/create-research-thread.ts` | 4 |
| 9 | `lib/services/research/create-research-response.ts` | 4 |
| 10 | `hooks/research/use-research-topic-create.ts` | 5 |
| 11 | `hooks/research/use-research-response-create.ts` | 5 |
| 12 | `components/research/research-nav-actions.tsx` | 6 |
| 13 | `components/research/research-sort-filter.tsx` | 6 |
| 14 | `components/research/research-thread-card.tsx` | 6 |
| 15 | `components/research/research-thread-list.tsx` | 6 |
| 16 | `components/research/research-post.tsx` | 6 |
| 17 | `components/research/research-post-list.tsx` | 6 |
| 18 | `components/research/research-reply-editor.tsx` | 6 |
| 19 | `components/research/research-topic-create-form.tsx` | 6 |
| 20 | `components/research/research-thread-view.tsx` | 7 |
| 21 | `components/home/research-category-list.tsx` | 8 |
| 22 | `app/api/research/[threadId]/view/route.ts` | 11 |

### New route pages (3)

| # | Route | File | Phase |
|---|-------|------|-------|
| 1 | `/research` | `app/research/page.tsx` | 7 |
| 2 | `/research/new` | `app/research/new/page.tsx` | 7 |
| 3 | `/research/thread/[threadId]` | `app/research/thread/[threadId]/page.tsx` | 7 |

### Updated files (5)

| # | File | Phase | Change |
|---|------|-------|--------|
| 1 | `lib/shared/constants.ts` | 4 | Add RESEARCH_GROUP_ADDRESS, RESEARCH_FEED_ADDRESS |
| 2 | `lib/services/board/get-boards.ts` | 8 | Remove technical from boards, add getResearchSection |
| 3 | `app/page.tsx` | 8 | Add ResearchCategoryList to homepage |
| 4 | `components/shared/content-renderer.tsx` | 9 | Add remarkGfm |
| 5 | `components/editor/slash-menu.tsx` | 9 | Uncomment table |
| 6 | `app/actions/revalidate-path.ts` | 10 | Add research revalidation helpers |

### Supabase (run manually)

- Create `research_categories` table + seed 7 rows
- Create `research_publications` table + indexes

### Shared code reused (no changes needed)

| Code | Used for |
|------|----------|
| `lib/external/lens/primitives/articles.ts` → `createThreadArticle` | Creating root publications |
| `lib/external/lens/primitives/posts.ts` → `fetchPostsByFeed`, `fetchPostsBatch`, `fetchCommentsByPostId` | Fetching posts |
| `lib/domain/replies/content.ts` → `getReplyContent` | Extracting content from any Post |
| `lib/domain/threads/content.ts` → `stripThreadArticleFormatting` | Stripping prefix from article content |
| `components/shared/content-renderer.tsx` → `ContentRenderer` | Rendering markdown |
| `components/editor/text-editor.tsx` → `TextEditor` | Full rich editor for all posts |
| `components/notifications/avatar-profile-link.tsx` → `AvatarProfileLink` | Author avatars |
| `components/reply/reply-voting.tsx` → `ReplyVoting` | Voting on posts |
| `components/ui/tags-input.tsx` → `TagsInput` | Tag input in create form |
| `hooks/forms/use-tags-input.ts` → `useTagsInput` | Tag state management |
| `components/pages/protected-route.tsx` → `ProtectedRoute` | Auth gate |

---

## Testing Checklist (Phase 12)

After all phases are complete, verify:

- [ ] `/research` page loads, shows threads sorted by recent activity
- [ ] Category filter tabs work — clicking filters the list
- [ ] Tag filter works
- [ ] "All" tab shows everything
- [ ] `/research/new` page loads with category selector, tag input, full editor
- [ ] Creating a topic: appears on listing, category count increments on homepage
- [ ] `/research/thread/[id]` page loads, shows all posts flat
- [ ] Post #1 (root) looks identical to #2, #3 (responses)
- [ ] Reply button on each post scrolls to editor with blockquote
- [ ] Creating a response: appears in thread, total_posts increments
- [ ] Homepage: technical section shows 7 categories with counts, links to `/research`
- [ ] Homepage: technical section no longer shows as board links
- [ ] ContentRenderer renders tables correctly (GFM)
- [ ] Slash menu shows Table option
- [ ] View count increments when visiting a thread
- [ ] Build passes: `npm run build`
- [ ] Type check passes: `npx tsc --noEmit` (for research files)

---

## Before You Start

1. **User creates Lens Group** → provides address → update `RESEARCH_GROUP_ADDRESS` in constants
2. **User creates Lens Feed** → provides address → update `RESEARCH_FEED_ADDRESS` in constants
3. **User runs SQL** in Supabase to create tables and seed categories
4. **Create branch:** `git checkout -b feature/research-system`
5. **Follow phases top to bottom.** Commit after each phase.
