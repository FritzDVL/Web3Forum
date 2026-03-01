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
  revalidatePath(`/commons/${feedAddress}/post/${postId}`);
}

export async function revalidateFeedPath(feedAddress: Address) {
  revalidatePath(`/commons/${feedAddress}`);
}
