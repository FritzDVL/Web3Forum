export type PublishStatus = "pending" | "confirmed" | "failed";

export interface ForumBoard {
  slug: string;
  name: string;
  description: string | null;
  section: string;
  feedType: string;
  displayOrder: number;
  isLocked: boolean;
  threadCount: number;
  replyCount: number;
  viewsCount: number;
  lastActivityAt: string | null;
  color: string | null;
}

export interface ForumThread {
  id: string;
  lensPostId: string | null;
  contentUri: string | null;
  boardSlug: string | null;
  feedType: string;
  title: string;
  summary: string;
  contentMarkdown: string | null;
  contentJson: any | null;
  authorAddress: string;
  authorUsername: string | null;
  replyCount: number;
  viewsCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  publishStatus: PublishStatus;
  tags: string[] | null;
  slug: string | null;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  lensPostId: string | null;
  contentUri: string | null;
  position: number;
  contentMarkdown: string | null;
  contentJson: any | null;
  authorAddress: string;
  authorUsername: string | null;
  isHidden: boolean;
  publishStatus: PublishStatus;
  createdAt: string;
  updatedAt: string;
}
