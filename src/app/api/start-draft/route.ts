import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const draftId = uuidv4();

    // Create draft record
    const { error: insertError } = await supabase
      .from("grant_drafts")
      .insert({
        id: draftId,
        user_id: user.id,
        title: `助成金申請書ドラフト - ${new Date().toLocaleDateString("ja-JP")}`,
        content: {
          sections: [],
          guidelineId: fileId,
        },
        guideline_id: fileId,
      });

    if (insertError) {
      console.error("Draft creation error:", insertError);
      return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
    }

    // Trigger draft generation
    const { error: functionError } = await supabase.functions.invoke("generate_draft", {
      body: { 
        draftId,
        guidelineId: fileId,
        userId: user.id,
        applicantProfile: {
          organization: user.user_metadata?.organization || "未設定",
          email: user.email,
        },
      },
    });

    if (functionError) {
      console.error("Draft generation error:", functionError);
      // Continue anyway - user can manually trigger regeneration
    }

    return NextResponse.json({ draftId });
  } catch (error) {
    console.error("Start draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}