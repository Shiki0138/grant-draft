import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, section, formData } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `あなたは助成金申請書作成の専門家です。日本語で、申請書の各セクションに適した内容を生成してください。
以下のガイドラインに従ってください：
- 具体的で説得力のある内容を書く
- 申請者の情報に基づいてパーソナライズする
- 助成金審査員に響く内容にする
- 適切な長さで簡潔にまとめる`;

    let userPrompt = "";
    
    switch (section) {
      case "projectDescription":
        userPrompt = `以下の情報に基づいて、プロジェクト概要を作成してください：
プロジェクト名: ${formData.projectTitle}
組織名: ${formData.organization}
申請金額: ${formData.fundingAmount}
追加情報: ${prompt}

プロジェクトの背景、意義、期待される成果を含めた概要を200-300文字で作成してください。`;
        break;
        
      case "objectives":
        userPrompt = `以下の情報に基づいて、研究・活動目標を作成してください：
プロジェクト名: ${formData.projectTitle}
プロジェクト概要: ${formData.projectDescription}
追加情報: ${prompt}

具体的で測定可能な目標を3-5個のポイントで作成してください。`;
        break;
        
      case "methodology":
        userPrompt = `以下の情報に基づいて、研究・実施方法を作成してください：
プロジェクト名: ${formData.projectTitle}
目標: ${formData.objectives}
追加情報: ${prompt}

段階的で実現可能な実施方法を詳しく説明してください。`;
        break;
        
      case "timeline":
        userPrompt = `以下の情報に基づいて、実施スケジュールを作成してください：
プロジェクト名: ${formData.projectTitle}
実施方法: ${formData.methodology}
追加情報: ${prompt}

12ヶ月間のタイムラインを月単位で作成してください。`;
        break;
        
      case "budget":
        userPrompt = `以下の情報に基づいて、予算計画を作成してください：
申請金額: ${formData.fundingAmount}
プロジェクト内容: ${formData.projectDescription}
実施方法: ${formData.methodology}
追加情報: ${prompt}

申請金額に対する詳細な予算内訳を作成してください。`;
        break;
        
      default:
        userPrompt = `以下の情報に基づいて助成金申請書の内容を改善してください：
${prompt}
関連情報: ${JSON.stringify(formData, null, 2)}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0].message.content;

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}