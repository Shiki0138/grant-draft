"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    projectTitle: "",
    organization: "",
    fundingAmount: "",
    projectDescription: "",
    objectives: "",
    methodology: "",
    budget: "",
    timeline: ""
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [currentAiSection, setCurrentAiSection] = useState("");

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const generateDraft = () => {
    setShowPreview(true);
  };

  const openAiDialog = (section: string) => {
    setCurrentAiSection(section);
    setAiPrompt("");
    setShowAiDialog(true);
  };

  const generateWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast.error("プロンプトを入力してください");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          section: currentAiSection,
          formData: formData,
        }),
      });

      if (!response.ok) {
        throw new Error("AI生成に失敗しました");
      }

      const { content } = await response.json();
      handleInputChange(currentAiSection, content);
      setShowAiDialog(false);
      toast.success("AIが内容を生成しました！");
    } catch (error) {
      console.error("Error:", error);
      toast.error("AI生成中にエラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">プロジェクト名</label>
                <Input
                  value={formData.projectTitle}
                  onChange={(e) => handleInputChange("projectTitle", e.target.value)}
                  placeholder="プロジェクトのタイトルを入力してください"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">申請組織名</label>
                <Input
                  value={formData.organization}
                  onChange={(e) => handleInputChange("organization", e.target.value)}
                  placeholder="組織名を入力してください"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">申請金額</label>
                <Input
                  value={formData.fundingAmount}
                  onChange={(e) => handleInputChange("fundingAmount", e.target.value)}
                  placeholder="申請する金額を入力してください"
                  type="number"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">プロジェクト概要</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">プロジェクト概要</label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-y"
                    value={formData.projectDescription}
                    onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                    placeholder="プロジェクトの概要を詳しく説明してください"
                  />
                  <Button
                    onClick={() => openAiDialog("projectDescription")}
                    className="absolute top-2 right-2 h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                    type="button"
                  >
                    AI生成
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">研究・活動目標</label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-y"
                    value={formData.objectives}
                    onChange={(e) => handleInputChange("objectives", e.target.value)}
                    placeholder="プロジェクトの目標を具体的に記述してください"
                  />
                  <Button
                    onClick={() => openAiDialog("objectives")}
                    className="absolute top-2 right-2 h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                    type="button"
                  >
                    AI生成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">研究・実施方法</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">研究・実施方法</label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-y"
                    value={formData.methodology}
                    onChange={(e) => handleInputChange("methodology", e.target.value)}
                    placeholder="どのようにプロジェクトを実施するかを詳しく説明してください"
                  />
                  <Button
                    onClick={() => openAiDialog("methodology")}
                    className="absolute top-2 right-2 h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                    type="button"
                  >
                    AI生成
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">実施スケジュール</label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-y"
                    value={formData.timeline}
                    onChange={(e) => handleInputChange("timeline", e.target.value)}
                    placeholder="プロジェクトのスケジュールを記入してください"
                  />
                  <Button
                    onClick={() => openAiDialog("timeline")}
                    className="absolute top-2 right-2 h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                    type="button"
                  >
                    AI生成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">予算計画</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">予算の詳細</label>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-y"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                    placeholder="予算の内訳を詳しく記入してください"
                  />
                  <Button
                    onClick={() => openAiDialog("budget")}
                    className="absolute top-2 right-2 h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                    type="button"
                  >
                    AI生成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">助成金申請書ドラフト作成（デモ版）</h1>
          <p className="text-gray-600">ステップバイステップで助成金申請書を作成しましょう</p>
          <p className="text-sm text-amber-600 mt-2">※ これはデモ版です。完全な機能にはSupabaseの設定が必要です。</p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>ステップ {currentStep} / {totalSteps}</span>
              <span>{Math.round(progress)}% 完了</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {renderStepContent()}

          <div className="flex justify-between mt-8">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              前へ
            </Button>
            
            <div className="space-x-4">
              {currentStep === totalSteps ? (
                <Button onClick={generateDraft} className="bg-blue-600 hover:bg-blue-700">
                  ドラフトを生成
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  次へ
                </Button>
              )}
            </div>
          </div>
        </div>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>申請書ドラフト - プレビュー</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div>
                <h3 className="font-bold text-lg mb-2">1. 基本情報</h3>
                <p><strong>プロジェクト名:</strong> {formData.projectTitle}</p>
                <p><strong>申請組織名:</strong> {formData.organization}</p>
                <p><strong>申請金額:</strong> ¥{formData.fundingAmount}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">2. プロジェクト概要</h3>
                <p className="whitespace-pre-wrap">{formData.projectDescription}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">3. 研究・活動目標</h3>
                <p className="whitespace-pre-wrap">{formData.objectives}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">4. 研究・実施方法</h3>
                <p className="whitespace-pre-wrap">{formData.methodology}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">5. 実施スケジュール</h3>
                <p className="whitespace-pre-wrap">{formData.timeline}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">6. 予算計画</h3>
                <p className="whitespace-pre-wrap">{formData.budget}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AIアシスタント</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                どのような内容を生成したいか、具体的な要求を入力してください。
              </p>
              <textarea
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-y"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="例: 環境保護に関するプロジェクトの概要を作成してください"
              />
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowAiDialog(false)}
                  variant="outline"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={generateWithAi}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? "生成中..." : "AI生成"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}