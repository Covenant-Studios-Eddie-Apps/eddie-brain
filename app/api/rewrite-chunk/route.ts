export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { heading, content, skillName, category, userPrompt, selectedText, neighboringHeadings } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 })

  const prompt = `You are an AI editor helping improve a skill file for an AI agent named Eddie.

Skill: "${skillName}" (${category})
Section: ${heading}
${neighboringHeadings?.length ? `Other sections in this skill: ${neighboringHeadings.join(', ')}` : ''}

${selectedText ? `The user has highlighted this text:\n"${selectedText}"\n` : ''}Current section content:
${content}

User's instruction: "${userPrompt || 'Improve this section'}"

${selectedText
  ? `Apply the instruction specifically to the highlighted text. Return the FULL section content with the highlighted portion replaced/improved.`
  : `Apply the instruction to the entire section. Return ONLY the improved content, no heading, no explanation.`
}`

  const body = {
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }]
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  })

  const data = await resp.json()
  const improved = data.content?.[0]?.text ?? content
  return NextResponse.json({ improved })
}
