import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { skills, intent } = await req.json();

    const skillsContext = (skills || [])
      .map((s: { path: string; description: string; content: string }) =>
        `### SKILL: ${s.path}\n**Description:** ${s.description || 'n/a'}\n\n${s.content || '(no content)'}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are Eddie's prompt generator. Given skill files and a user's intent, generate a clear actionable prompt Eddie can execute. Output ONLY the final prompt, no preamble, no explanation.`;
    const userMsg = `SELECTED SKILLS:\n${skillsContext}\n\nUSER INTENT:\n${intent || '(combine these skills into a workflow)'}\n\nGenerate a prompt I can send to Eddie.`;

    const apiKey = process.env.CLAUDE_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'CLAUDE_API_KEY env var not set on server' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: `Claude API: ${data.error.message || JSON.stringify(data.error)}` }, { status: 400 });
    }

    const text = data.content?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: `Unexpected response: ${JSON.stringify(data).slice(0, 300)}` }, { status: 500 });
    }

    return NextResponse.json({ prompt: text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
