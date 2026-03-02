import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/external/supabase/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const supabase = await supabaseClient();

    // Increment view count
    const { error } = await supabase
      .from("feed_posts")
      .update({ views_count: supabase.raw("views_count + 1") as any })
      .eq("lens_post_id", postId);

    if (error) {
      console.error("Failed to increment view count:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
