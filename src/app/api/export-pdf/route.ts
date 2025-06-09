import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get draft data
    const { data: draft, error: draftError } = await supabase
      .from("grant_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Trigger PDF export function
    const { data, error: functionError } = await supabase.functions.invoke("export_pdf", {
      body: { 
        draftId,
        userId: user.id,
        content: draft.content,
        title: draft.title,
      },
    });

    if (functionError) {
      console.error("PDF export error:", functionError);
      return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Export PDF error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}