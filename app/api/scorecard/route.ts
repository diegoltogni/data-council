import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const maxDuration = 30;

function resolveApiKey(req: Request): string | null {
  const serverKey = process.env.ANTHROPIC_API_KEY;
  if (serverKey && serverKey !== 'your-api-key-here') return serverKey;
  const headerKey = req.headers.get('x-api-key');
  if (headerKey && headerKey.trim()) return headerKey.trim();
  return null;
}

export async function POST(req: Request) {
  const apiKey = resolveApiKey(req);
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 401 });
  }

  let body: { topic: string; transcript: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { topic, transcript, winner } = body as { topic: string; transcript: string; winner?: string };
  if (!topic || !transcript) {
    return Response.json({ error: 'Missing topic or transcript' }, { status: 400 });
  }

  try {
    const client = createAnthropic({ apiKey });

    const winnerInstruction = winner
      ? `The council already decided the winner is "${winner}". Use this as the winner — do NOT re-judge.`
      : `Determine the winner from the transcript.`;

    const result = await generateText({
      model: client('claude-sonnet-4-20250514'),
      system: `You generate structured scorecard data from debate transcripts. Respond ONLY with valid JSON, no other text.`,
      messages: [
        {
          role: 'user',
          content: `Topic: "${topic}"
${winnerInstruction}

Debate transcript:
${transcript.slice(0, 5000)}

Generate a scorecard. Return ONLY this JSON format:
{
  "topicShort": "A vs B format (e.g. 'Jordan vs LeBron', 'Trump vs Obama')",
  "winner": "Name of the winning side",
  "loser": "Name of the losing side",
  "stats": [
    { "label": "Stat name", "winner_value": "value", "loser_value": "value" },
    { "label": "Stat name", "winner_value": "value", "loser_value": "value" },
    { "label": "Stat name", "winner_value": "value", "loser_value": "value" }
  ],
  "summary": "One sentence explaining why the winner won"
}

Rules:
- "topicShort" must be a clean "A vs B" format — just the two names/sides
- Use exactly 3 stats that were actually discussed in the debate
- Use REAL, accurate values — not made up numbers
- Keep stat labels short (3-4 words max)
- Keep summary to one punchy sentence
- CRITICAL: winner/loser MUST be the actual DEBATE SUBJECTS (e.g. "Jordan", "LeBron") — NEVER analyst names like "The Quant" or "The Hot Take"`,
        },
      ],
      temperature: 0.3,
      maxOutputTokens: 300,
    });

    // Parse the JSON from the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to generate scorecard' }, { status: 500 });
    }

    const scorecard = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!scorecard.winner || !scorecard.loser || !Array.isArray(scorecard.stats)) {
      return Response.json({ error: 'Invalid scorecard format' }, { status: 500 });
    }

    return Response.json(scorecard);
  } catch (error) {
    console.error('[scorecard] Error:', error);
    return Response.json({ error: 'Failed to generate scorecard' }, { status: 500 });
  }
}
