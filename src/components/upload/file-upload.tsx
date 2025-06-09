"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, File, Link } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (fileId: string) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("アップロードに失敗しました");
      }

      const { fileId } = await response.json();
      toast.success("ファイルがアップロードされました");
      onUploadComplete(fileId);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("ファイルのアップロードに失敗しました");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const handleUrlSubmit = async () => {
    if (!url) {
      toast.error("URLを入力してください");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("URLからの取得に失敗しました");
      }

      const { fileId } = await response.json();
      toast.success("ファイルが取得されました");
      onUploadComplete(fileId);
      setUrl("");
    } catch (error) {
      console.error("URL fetch error:", error);
      toast.error("URLからのファイル取得に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("PDFファイルのみアップロード可能です");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("ファイルサイズは10MB以下にしてください");
        return;
      }
      uploadFile(file);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  // Simulate progress for demo
  if (uploading && progress < 90) {
    setTimeout(() => setProgress(prev => Math.min(prev + 10, 90)), 200);
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">ドロップしてアップロード</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              PDFファイルをドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-500">
              またはクリックしてファイルを選択
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">または</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="PDFのURLを入力"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={uploading}
          />
          <Button
            onClick={handleUrlSubmit}
            disabled={uploading || !url}
            variant="outline"
          >
            <Link className="h-4 w-4 mr-2" />
            取得
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>アップロード中...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}