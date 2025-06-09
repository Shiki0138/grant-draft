import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRRequest {
  fileId: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileId, userId } = await req.json() as OCRRequest

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('grant_files')
      .download(`${userId}/${fileId}.pdf`)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert PDF to text (simplified for MVP - in production, use proper OCR library)
    // For now, we'll simulate OCR with a placeholder
    const markdown = `# Grant Application Guidelines

## Overview
This document contains the guidelines for grant applications.

## Eligibility Criteria
- Organizations must be registered non-profits
- Projects must align with funding priorities
- Budget must be within specified limits

## Application Requirements
1. Project description (max 1000 characters)
2. Budget breakdown
3. Timeline and milestones
4. Expected outcomes and impact

## Evaluation Criteria
- Innovation and originality
- Feasibility and sustainability
- Community impact
- Cost-effectiveness

[Document processed from PDF: ${fileId}]`

    // Save markdown to storage
    const { error: uploadError } = await supabase.storage
      .from('grant_files')
      .upload(`parsed/${userId}/${fileId}.md`, markdown, {
        contentType: 'text/markdown',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Failed to save markdown: ${uploadError.message}`)
    }

    // Store in database for vector embedding
    const { error: dbError } = await supabase
      .from('grant_documents')
      .insert({
        user_id: userId,
        role: 'guideline',
        content: markdown,
        metadata: { fileId, originalName: `${fileId}.pdf` },
      })

    if (dbError) {
      throw new Error(`Failed to save to database: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, markdown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})