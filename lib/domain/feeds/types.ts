import { Address } from "@/types/common";
import { Account, Post } from "@lens-protocol/client";

export interface FeedPost {
  id: string;
  feedId: string;
  feedAddress: Address;
  author: Account;
  rootPost: Post;
  title: string;
  summary: string;
  repliesCount: number;
  viewsCount: number;
  isVisible: boolean;
  created_at: string;
  updatedAt: string;
  app?: string;
}

export interface CreateFeedPostFormData {
  title: string;
  summary: string;
  content: string;
  tags?: string;
  author: Address;
}
