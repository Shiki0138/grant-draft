import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbedRequest {
  markdown: string
  role: 'guideline' | 'case' | 'application'
  userId: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { markdown, role, userId, metadata } = await req.json() as EmbedRequest

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Split markdown into chunks (max 800 tokens ~ 3200 chars)
    const chunks = splitIntoChunks(markdown, 3200)

    // Get embeddings for each chunk
    const embeddings = await Promise.all(
      chunks.map(chunk => getEmbedding(chunk, openaiKey))
    )

    // Store each chunk with its embedding
    const documents = chunks.map((chunk, index) => ({
      user_id: userId,
      role,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }))

    const { error: insertError } = await supabase
      .from('grant_documents')
      .insert(documents)

    if (insertError) {
      throw new Error(`Failed to store embeddings: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  const paragraphs = text.split('\n\n')
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      // If single paragraph is too long, split it
      if (paragraph.length > maxLength) {
        const words = paragraph.split(' ')
        let tempChunk = ''
        for (const word of words) {
          if (tempChunk.length + word.length > maxLength) {
            chunks.push(tempChunk.trim())
            tempChunk = word
          } else {
            tempChunk += (tempChunk ? ' ' : '') + word
          }
        }
        currentChunk = tempChunk
      } else {
        currentChunk = paragraph
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}