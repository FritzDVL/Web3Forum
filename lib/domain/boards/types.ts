import { Address } from "@/types/common";
import { Account, Post } from "@lens-protocol/client";

/**
 * A Board is a Lens Feed used as a fixed topic container.
 * Mapped from the `feeds` Supabase table.
 */
export interface Board {
  id: string;
  name: string;
  description: string;
  feedAddress: Address;
  category: string;
  displayOrder: number;
  isLocked: boolean;
  postCount: number;
  repliesCount: number;
  viewsCount: number;
  lastPostAt: string | null;
}

/**
 * A BoardPost is a root-level Lens Post published to a Board's Feed.
 * The full Lens Post and Account are preserved — never destructured.
 */
export interface BoardPost {
  id: string;
  lensPostId: string;
  board: Board;
  rootPost: Post;
  author: Account;
  title: string;
  summary: string;
  repliesCount: number;
  viewsCount: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  app?: string;
}

/**
 * Form data for creating a new board post.
 */
export interface CreateBoardPostFormData {
  title: string;
  summary: string;
  content: string;
  tags?: string;
  author: Address;
}
