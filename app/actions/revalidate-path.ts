"use server";

import { revalidatePath } from "next/cache";
import { Address } from "@/types/common";

export async function revalidateCommunityPath(address: Address) {
  revalidatePath(`/communities/${address}`);
}

export async function revalidateCommunitiesPath() {
  revalidatePath(`/communities`);
}

export async function revalidateCommunityAndListPaths(address: Address) {
  await Promise.all([revalidateCommunityPath(address), revalidateCommunitiesPath()]);
}

export async function revalidateThreadPath(address: string) {
  revalidatePath(`/thread/${address}`);
}

export async function revalidateThreadsPath() {
  revalidatePath(`/thread`);
}

export async function revalidateThreadAndListPaths(address: string) {
  await Promise.all([revalidateThreadPath(address), revalidateThreadsPath()]);
}

export async function revalidateHomePath() {
  revalidatePath(`/`);
}

export async function revalidateFeedPostPath(feedAddress: Address, postId: string) {
  revalidatePath(`/boards/${feedAddress}/post/${postId}`);
}

export async function revalidateFeedPath(feedAddress: Address) {
  revalidatePath(`/boards/${feedAddress}`);
}

export async function revalidateResearchPath() {
  revalidatePath("/research");
}

export async function revalidateResearchThreadPath(threadId: string) {
  revalidatePath(`/research/thread/${threadId}`);
}

export async function revalidateBoardPath(boardSlug: string) {
  revalidatePath(`/boards/${boardSlug}`);
}

export async function revalidateBoardPostPath(boardSlug: string, postId: string) {
  revalidatePath(`/boards/${boardSlug}/post/${postId}`);
}
