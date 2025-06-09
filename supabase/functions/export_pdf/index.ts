import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportPDFRequest {
  draftId: string
  userId: string
  content: {
    sections: Array<{
      heading: string
      body: string
    }>
  }
  title: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = await req.json() as ExportPDFRequest
    const { draftId, userId, content, title } = request

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add title page
    let page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 24
    const titleFontSize = 32

    page.drawText(title, {
      x: 50,
      y: height - 100,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(new Date().toLocaleDateString('ja-JP'), {
      x: 50,
      y: height - 150,
      size: 14,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Add sections
    let currentY = height - 250
    const margin = 50
    const lineHeight = fontSize * 1.5
    const maxWidth = width - 2 * margin

    for (const section of content.sections) {
      // Check if we need a new page
      if (currentY < 150) {
        page = pdfDoc.addPage()
        currentY = height - margin
      }

      // Draw section heading
      page.drawText(section.heading, {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      currentY -= lineHeight * 1.5

      // Draw section body
      const bodyLines = wrapText(section.body, font, fontSize, maxWidth)
      for (const line of bodyLines) {
        if (currentY < margin) {
          page = pdfDoc.addPage()
          currentY = height - margin
        }

        page.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        currentY -= lineHeight
      }

      currentY -= lineHeight // Extra space between sections
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    const fileName = `${userId}/${draftId}.pdf`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('grant_files')
      .upload(`output/${fileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Generate signed URL (5 minutes)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('grant_files')
      .createSignedUrl(`output/${fileName}`, 300)

    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`)
    }

    return new Response(
      JSON.stringify({ url: urlData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to wrap text
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}