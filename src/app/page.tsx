"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FileText, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const checkAuth = useCallback(async () => {
    try {
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch {
      console.log("Supabase not configured, using demo mode");
      setIsAuthenticated(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleGetStarted = () => {
    // Check if Supabase is properly configured
    const supabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                               process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';
    
    if (!supabaseConfigured) {
      router.push("/demo");
    } else if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GrantDraft</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/demo">
              <Button variant="outline">デモを試す</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>ダッシュボード</Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button variant="outline">ログイン</Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          助成金申請書作成を
          <span className="text-blue-600">革新的に簡単に</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AI技術とベクトル検索を活用し、ガイドラインPDFから最適な申請書ドラフトを
          ワンクリックで生成。日本屈指の助成金申請支援システム。
        </p>
        <Button 
          onClick={handleGetStarted}
          size="lg" 
          className="text-lg px-8 py-6"
        >
          今すぐ始める
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          主要機能
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-blue-600" />}
            title="PDF OCR処理"
            description="アップロードされたPDFから自動的にテキストを抽出し、構造化データに変換"
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-blue-600" />}
            title="AI駆動の生成"
            description="OpenAI GPTとpgvectorによる類似文書検索で最適なドラフトを生成"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-blue-600" />}
            title="エンタープライズセキュリティ"
            description="RLS、暗号化、署名付きURLによる高度なセキュリティ保護"
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-blue-600" />}
            title="マルチテナント対応"
            description="組織ごとに完全に分離されたデータ管理と権限制御"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            使い方
          </h2>
          <div className="max-w-4xl mx-auto">
            <Step number={1} title="ガイドラインをアップロード">
              助成金のガイドラインPDFをドラッグ&ドロップでアップロード
            </Step>
            <Step number={2} title="AIが内容を解析">
              OCR技術で文書を解析し、ベクトル検索で類似文書を特定
            </Step>
            <Step number={3} title="ドラフトを自動生成">
              ガイドラインに沿った申請書ドラフトをAIが自動生成
            </Step>
            <Step number={4} title="編集してPDF出力">
              リッチテキストエディタで編集し、選択可能なテキストでPDF出力
            </Step>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          助成金申請の効率を10倍に
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          今すぐ無料で始めて、申請書作成時間を大幅に短縮しましょう
        </p>
        <Button 
          onClick={handleGetStarted}
          size="lg" 
          className="text-lg px-8 py-6"
        >
          無料で始める
        </Button>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, children }: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start mb-8">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{children}</p>
      </div>
    </div>
  );
}