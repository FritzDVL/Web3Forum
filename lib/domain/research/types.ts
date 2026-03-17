import { Post } from "@lens-protocol/client";

export interface ResearchCategory {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  publicationCount: number;
  viewsCount: number;
}

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

export interface ResearchPublication {
  id: string;
  lensPostId: string;
  rootLensPostId: string | null;
  post: Post;
  postNumber: number;
  isRoot: boolean;
  createdAt: string;
}

export interface CreateResearchTopicFormData {
  title: string;
  content: string;
  categorySlug: string;
  tags: string[];
}

export interface CreateResearchResponseFormData {
  content: string;
}
