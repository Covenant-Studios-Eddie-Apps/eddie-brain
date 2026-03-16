import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { skills, intent } = await req.json();

  const skillsContext = skills
    .map((s: { path: string; description: string; content: string }) =>
      `### SKILL: ${s.path}\n**Description:** ${s.description || 'n/a'}\n\n${s.content || '(no content)'}`
    )
    .join('\n\n---\n\n');

  const systemPrompt = `You are Eddie's prompt generator. Given a set of skill files and a user's intent, generate a clear, actionable prompt that Eddie (an AI assistant) can execute. The prompt should reference the relevant skills, include all necessary context, be direct and specific, and be ready to copy-paste and send to Eddie. Output ONLY the final prompt. No preamble, no explanation.`;

  const userMsg = `SELECTED SKILLS:\n${skillsContext}\n\nUSER INTENT:\n${intent || '(combine these skills into a workflow)'}\n\nGenerate a prompt I can send to Eddie to execute this.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY || '',
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
  const text = data.content?.[0]?.text || 'Error generating prompt';
  return NextResponse.json({ prompt: text });
}
