import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { gigs, niche } = await req.json()
  if (!gigs || !Array.isArray(gigs) || gigs.length === 0) {
    return NextResponse.json({ error: 'No gig data provided' }, { status: 400 })
  }

  const gigSummary = gigs.slice(0, 20).map((g: Record<string, unknown>, i: number) => {
    const lines = [`${i + 1}. TITLE: "${g.title}"`]
    if (g.seller)       lines.push(`   Seller: ${g.seller}`)
    if (g.price)        lines.push(`   Starting price: ${g.price}`)
    if (g.rating)       lines.push(`   Rating: ${g.rating}`)
    if (g.description)  lines.push(`   Description: ${String(g.description).slice(0, 300)}`)
    if (g.packages)     lines.push(`   Packages: ${JSON.stringify(g.packages).slice(0, 300)}`)
    if (g.faq)          lines.push(`   FAQ: ${JSON.stringify(g.faq).slice(0, 200)}`)
    if (g.requirements) lines.push(`   Requirements: ${JSON.stringify(g.requirements).slice(0, 200)}`)
    if (g.tags)         lines.push(`   Tags: ${Array.isArray(g.tags) ? g.tags.join(', ') : g.tags}`)
    return lines.join('\n')
  }).join('\n\n')

  const prompt = `Analyze these top-ranking Fiverr gigs${niche ? ` in the "${niche}" niche` : ''} and generate complete, publish-ready Fiverr gig content — not suggestions, not templates. Return ONLY valid JSON with zero markdown, zero backticks, zero placeholders, and no explanation. Everything should be ready to copy and paste directly into Fiverr.

TOP-RANKING GIGS DATA:
${gigSummary}

Use this exact JSON structure:
{
  "overview": {
    "gigTitle": "The exact gig title to use on Fiverr (max 80 chars, keyword-optimized)",
    "titleAlternatives": ["Alternative title 2", "Alternative title 3"],
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "competitiveEdge": {
      "gaps": ["Gap 1", "Gap 2"],
      "differentiators": ["Differentiator 1", "Differentiator 2"],
      "summary": "Strategic summary paragraph"
    }
  },
  "pricing": {
    "basic": {
      "label": "Exact package name e.g. Starter",
      "price": "$XX",
      "description": "Exact package description text to paste into Fiverr (1-2 sentences)",
      "deliverables": ["Exact deliverable line 1", "Exact deliverable line 2"],
      "deliveryDays": 3,
      "revisions": 2
    },
    "standard": {
      "label": "Exact package name e.g. Professional",
      "price": "$XX",
      "description": "Exact package description text to paste into Fiverr",
      "deliverables": ["deliverable1", "deliverable2", "deliverable3"],
      "deliveryDays": 5,
      "revisions": 3
    },
    "premium": {
      "label": "Exact package name e.g. Elite",
      "price": "$XX",
      "description": "Exact package description text to paste into Fiverr",
      "deliverables": ["deliverable1", "deliverable2", "deliverable3", "deliverable4"],
      "deliveryDays": 7,
      "revisions": "Unlimited"
    },
    "extras": [
      { "name": "Exact extra name", "description": "What it includes", "price": "$XX" },
      { "name": "Exact extra name", "description": "What it includes", "price": "$XX" }
    ]
  },
  "description": {
    "fullDescription": "The COMPLETE gig description ready to paste into Fiverr. 400-550 words. Written in first person. Includes: opening hook, services breakdown, process explanation, why choose me, and a call to action. Use line breaks and bullet points naturally. No placeholders — everything filled in based on niche analysis.",
    "faq": [
      { "question": "Exact FAQ question as it would appear on Fiverr", "answer": "Complete answer text, 2-4 sentences, ready to paste" },
      { "question": "Question 2", "answer": "Answer 2" },
      { "question": "Question 3", "answer": "Answer 3" },
      { "question": "Question 4", "answer": "Answer 4" }
    ]
  },
  "requirements": {
    "fullRequirementsText": "The complete requirements text to paste into Fiverr, written as a numbered list asking buyers for everything needed to start the project. Specific to the niche. No placeholders.",
    "items": [
      { "question": "Exact requirement question to ask buyer", "type": "free_text or multiple_choice", "required": true },
      { "question": "Question 2", "type": "free_text", "required": true },
      { "question": "Question 3", "type": "free_text", "required": false }
    ]
  },
  "gallery": {
    "heroImagePrompt": "An extremely detailed, hyper-realistic AI image generation prompt for the MAIN gig thumbnail. Include: exact subject matter specific to the niche, lighting setup (e.g. soft diffused studio light with warm rim light), camera lens and angle, background details, color grading style, mood/atmosphere, render quality (photorealistic, 8K, sharp focus, professional photography). Also describe any text overlays or UI mockup elements to composite on top. Long enough to produce a professional result in Midjourney v6 or DALL-E 3.",
    "additionalPrompts": [
      "Full detailed prompt for slide 2 — showing portfolio/results/before-after specific to this niche",
      "Full detailed prompt for slide 3 — showing the process or a professional workspace relevant to this niche",
      "Full detailed prompt for slide 4 — showing happy client or deliverable result"
    ],
    "slides": [
      { "slide": 1, "purpose": "Hero thumbnail", "exactHeadline": "Exact bold headline text to overlay on image", "exactSubline": "Exact subline text" },
      { "slide": 2, "purpose": "Services/Portfolio", "exactHeadline": "Exact headline", "exactSubline": "Exact subline" },
      { "slide": 3, "purpose": "Process", "exactHeadline": "Exact headline", "exactSubline": "Exact subline" },
      { "slide": 4, "purpose": "Social proof / results", "exactHeadline": "Exact headline", "exactSubline": "Exact subline" },
      { "slide": 5, "purpose": "CTA", "exactHeadline": "Exact headline", "exactSubline": "Exact subline" }
    ],
    "colorPalette": ["#hex1", "#hex2", "#hex3"],
    "fontRecommendation": "Specific font pairing recommendation for the thumbnail"
  }
}`

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set in .env.local' }, { status: 500 })
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional Fiverr gig copywriter and SEO expert. Generate complete, publish-ready gig content — not suggestions or templates. Everything you write should be ready to copy and paste directly into Fiverr with zero editing. Be specific, confident, and write as if you are the seller.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Groq error:', err)
      return NextResponse.json(
        { error: `Groq API error: ${err?.error?.message || response.statusText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content
    const analysis = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent

    return NextResponse.json({ analysis, gigCount: gigs.length })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed. Check your Groq API key and try again.' }, { status: 500 })
  }
}
