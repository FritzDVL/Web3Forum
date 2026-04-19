import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    // Try forum_threads first (by UUID id)
    const { error } = await supabase.rpc("increment_forum_views", { t_id: postId });

    if (error) {
      // Silently fail — view tracking is non-critical
      console.warn("View tracking failed:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
