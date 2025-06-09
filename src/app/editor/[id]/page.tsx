"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const DraftEditor = dynamic(() => import("@/components/editor/draft-editor"), {
  ssr: false,
});

interface DraftSection {
  heading: string;
  body: string;
}

interface DraftContent {
  sections: DraftSection[];
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<{
    id: string;
    title: string;
    content: DraftContent;
    updated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const loadDraft = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }
      
      const { data, error } = await supabase
        .from("grant_drafts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;

      setDraft(data);
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("ドラフトの読み込みに失敗しました");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [params.id, supabase, router]);

  useEffect(() => {
    if (params.id) {
      loadDraft();
    }
  }, [params.id, loadDraft]);

  const saveDraft = async (content: DraftContent) => {
    if (!supabase) {
      toast.error("Supabaseが設定されていません");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("grant_drafts")
        .update({ 
          content,
          updated_at: new Date().toISOString() 
        })
        .eq("id", params.id);

      if (error) throw error;

      toast.success("保存しました");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: params.id }),
      });

      if (!response.ok) throw new Error("PDF export failed");

      const { url } = await response.json();
      window.open(url, "_blank");
      toast.success("PDFをエクスポートしました");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("PDFエクスポートに失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{draft.title}</h1>
              <p className="text-sm text-gray-500">
                最終更新: {new Date(draft.updated_at).toLocaleString("ja-JP")}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => saveDraft(draft.content)}
                disabled={saving}
                variant="outline"
              >
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button onClick={exportPDF}>
                PDFエクスポート
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <DraftEditor
          content={draft.content}
          onChange={(content) => setDraft({ ...draft, content })}
          onSave={saveDraft}
        />
      </main>
    </div>
  );
}