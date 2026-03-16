export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { heading, content, skillName, category } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 })

  const body = {
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are improving a section of an AI agent skill file called "${skillName}" (category: ${category}).

Section heading: ${heading}

Current content:
${content}

Rewrite this section to be clearer, more concise, and better structured. Keep all the same information and technical details. Return ONLY the improved content with no heading and no explanation.`
    }]
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
