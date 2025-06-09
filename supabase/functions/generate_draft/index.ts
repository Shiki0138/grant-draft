import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateDraftRequest {
  draftId: string
  guidelineId: string
  userId: string
  applicantProfile: {
    organization: string
    email: string
  }
  extraDocsIds?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = await req.json() as GenerateDraftRequest
    const { draftId, guidelineId, userId, applicantProfile } = request

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get guideline document embedding
    const { data: guideline } = await supabase
      .from('grant_documents')
      .select('content, embedding')
      .eq('user_id', userId)
      .eq('role', 'guideline')
      .single()

    if (!guideline || !guideline.embedding) {
      throw new Error('Guideline document not found or not embedded')
    }

    // Search for similar documents using pgvector
    const { data: similarDocs } = await supabase.rpc('match_grant_documents', {
      query_embedding: guideline.embedding,
      match_count: 6,
      filter: { role: ['guideline', 'case'] }
    })

    // Build context from similar documents
    const context = similarDocs?.map(doc => doc.content).join('\n\n---\n\n') || ''

    // Generate draft using OpenAI
    const systemPrompt = `あなたは助成金申請書作成の専門コンサルタントです。
以下のガイドラインと類似文書を参考に、申請書のドラフトを作成してください。

要件：
1. 各セクションは日本語で記述する
2. 各セクションの本文は最大1000文字以内
3. 具体的で説得力のある内容にする
4. 申請者の情報を適切に組み込む

出力形式（JSON）：
{
  "sections": [
    {
      "heading": "セクションタイトル",
      "body": "セクション本文（最大1000文字）"
    }
  ]
}`

    const userPrompt = `申請者情報：
組織名: ${applicantProfile.organization}
メールアドレス: ${applicantProfile.email}

ガイドライン：
${guideline.content}

参考文書：
${context}

上記の情報を基に、助成金申請書のドラフトをJSON形式で作成してください。`

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    })

    if (!completion.ok) {
      throw new Error(`OpenAI API error: ${completion.statusText}`)
    }

    const result = await completion.json()
    const draftContent = JSON.parse(result.choices[0].message.content)

    // Update draft in database
    const { error: updateError } = await supabase
      .from('grant_drafts')
      .update({
        content: draftContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Failed to update draft: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, draft: draftContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})