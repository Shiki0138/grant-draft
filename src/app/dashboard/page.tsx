"use client";

import { useState } from "react";
import { FileUpload } from "@/components/upload/file-upload";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardPage() {
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleUploadComplete = (fileId: string) => {
    setUploadedFileId(fileId);
  };

  const startDraftGeneration = async () => {
    if (!uploadedFileId) {
      toast.error("ファイルをアップロードしてください");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/start-draft?fileId=${uploadedFileId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("ドラフト生成の開始に失敗しました");
      }

      const { draftId } = await response.json();
      toast.success("ドラフト生成を開始しました");
      router.push(`/editor/${draftId}`);
    } catch (error) {
      console.error("Draft generation error:", error);
      toast.error("ドラフト生成の開始に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            助成金申請書ドラフト作成
          </h1>
          <p className="mt-2 text-gray-600">
            ガイドラインPDFをアップロードして、AIによる申請書ドラフトを生成します
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            ステップ1: ガイドラインのアップロード
          </h2>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>

        {uploadedFileId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              ステップ2: ドラフト生成
            </h2>
            <p className="text-gray-600 mb-4">
              ファイルのアップロードが完了しました。ドラフト生成を開始してください。
            </p>
            <Button
              onClick={startDraftGeneration}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              {processing ? "処理中..." : "ドラフト生成を開始"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}