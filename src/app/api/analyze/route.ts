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

  const prompt = `You are a world-class Fiverr SEO strategist and gig optimization expert. Analyze these top-ranking Fiverr gigs${niche ? ` in the "${niche}" niche` : ''} and provide a complete blueprint for someone to create a gig that ranks on page 1 and converts.

TOP-RANKING GIGS DATA:
${gigSummary}

Return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact structure:

{
  "overview": {
    "titleFormula": {
      "pattern": "The exact structural pattern top gigs use for their titles",
      "examples": ["Ready-to-use example title 1", "example 2", "example 3"],
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
      "tip": "One high-impact actionable insight about titles in this niche"
    },
    "tags": {
      "recommended": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
      "explanation": "Why these specific tags dominate in this niche"
    },
    "competitiveEdge": {
      "gaps": ["Specific gap 1 no one is filling", "Specific gap 2"],
      "differentiators": ["Concrete way to stand out 1", "Concrete way to stand out 2"],
      "summary": "2-3 sentence strategic overview of how to win in this niche"
    }
  },
  "pricing": {
    "basic":    { "price": "$XX", "label": "package name", "deliverables": ["item1", "item2"], "rationale": "why this works" },
    "standard": { "price": "$XX", "label": "package name", "deliverables": ["item1", "item2", "item3"], "rationale": "why this is the anchor" },
    "premium":  { "price": "$XX", "label": "package name", "deliverables": ["item1", "item2", "item3", "item4"], "rationale": "what justifies the top tier" },
    "strategy": "Big-picture pricing insight based on competition analysis",
    "extras": ["Common gig extra 1 with suggested price", "Common gig extra 2 with suggested price"]
  },
  "descriptionFaq": {
    "hook": "Attention-grabbing opening line ready to use in first person",
    "structure": [
      { "section": "Section name", "content": "What to write here and why" },
      { "section": "Section name", "content": "What to write here and why" },
      { "section": "Section name", "content": "What to write here and why" },
      { "section": "Section name", "content": "What to write here and why" }
    ],
    "mustInclude": ["Power phrase 1", "Power phrase 2", "Power phrase 3"],
    "wordCount": "Recommended range e.g. 350-500 words",
    "faqTemplates": [
      { "question": "Common buyer question 1?", "answer": "Suggested answer template" },
      { "question": "Common buyer question 2?", "answer": "Suggested answer template" },
      { "question": "Common buyer question 3?", "answer": "Suggested answer template" }
    ]
  },
  "requirements": {
    "essentials": ["Required info to ask buyer 1", "Required info to ask buyer 2", "Required info 3"],
    "optionals": ["Nice to have from buyer 1", "Nice to have from buyer 2"],
    "tips": "How to write requirements that reduce revisions and set clear expectations",
    "template": "Full ready-to-use requirements section text"
  },
  "gallery": {
    "imageCount": "Recommended number of images",
    "videoRecommended": true,
    "slides": [
      { "slide": 1, "purpose": "Hero / first impression", "layout": "Layout description", "content": "What text/visuals to put here" },
      { "slide": 2, "purpose": "Services offered", "layout": "Layout description", "content": "What to show" },
      { "slide": 3, "purpose": "Process / how it works", "layout": "Layout description", "content": "What to show" },
      { "slide": 4, "purpose": "Results / proof", "layout": "Layout description", "content": "What to show" },
      { "slide": 5, "purpose": "CTA / trust builder", "layout": "Layout description", "content": "What to show" }
    ],
    "colorPalette": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
    "styleNotes": "Visual style analysis of what top gigs use in their thumbnails",
    "heroImagePrompt": "An extremely detailed hyper-realistic AI image generation prompt for the main gig thumbnail. Include subject, lighting, camera angle, background, color grading, mood, render style (photorealistic 8K sharp focus), and suggested text overlays. Make it specific enough for Midjourney or DALL-E 3.",
    "additionalPrompts": [
      "Detailed prompt for a portfolio/results slide image",
      "Detailed prompt for a process/about me slide image"
    ]
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
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 3000,
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
    const text = data.choices?.[0]?.message?.content || ''

    // Parse JSON directly (Groq enforces valid JSON with response_format)
    const analysis = JSON.parse(text)

    return NextResponse.json({ analysis, gigCount: gigs.length })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed. Check your Groq API key and try again.' }, { status: 500 })
  }
}
