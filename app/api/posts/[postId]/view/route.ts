import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/external/supabase/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const supabase = await supabaseClient();

    // Increment view count using direct update
    const { data: post, error: fetchError } = await supabase
      .from("feed_posts")
      .select("views_count")
      .eq("lens_post_id", postId)
      .single();

    if (fetchError || !post) {
      // Post not in DB yet - this is OK for Lens-only posts
      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await supabase
      .from("feed_posts")
      .update({ views_count: (post.views_count || 0) + 1 })
      .eq("lens_post_id", postId);

    if (updateError) {
      console.error("Failed to increment view count:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({ success: true });
  }
}
