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

  const { topic, transcript, lang } = body as { topic: string; transcript: string; lang?: string };
  if (!topic || !transcript) {
    return Response.json({ error: 'Missing topic or transcript' }, { status: 400 });
  }

  try {
    const client = createAnthropic({ apiKey });

    const result = await generateText({
      model: client('claude-sonnet-4-20250514'),
      system: `You generate structured scorecard data from debate transcripts. You determine the winner based on the strongest arguments and data presented. Respond ONLY with valid JSON, no other text.`,
      messages: [
        {
          role: 'user',
          content: `Topic: "${topic}"

Debate transcript:
${transcript.slice(0, 5000)}

Based on the debate, determine the winner and generate a scorecard. Return ONLY this JSON:
{
  "topicShort": "A vs B",
  "winner": "Winner name",
  "loser": "Loser name",
  "stats": [
    { "label": "Stat", "winner_value": "val", "loser_value": "val" },
    { "label": "Stat", "winner_value": "val", "loser_value": "val" },
    { "label": "Stat", "winner_value": "val", "loser_value": "val" },
    { "label": "Stat", "winner_value": "val", "loser_value": "val" }
  ],
  "summary": "One sentence why the winner won"
}

Rules:
- "topicShort": clean "A vs B" format (e.g. "Jordan vs LeBron")
- Exactly 4 stats from the debate — real, accurate values
- Stat labels: 2-3 words max (e.g. "Career PPG", "Titles", "MVPs")
- winner/loser = debate SUBJECTS (e.g. "Jordan"), NEVER analyst names (e.g. "The Quant")
- Pick the winner based on which side had stronger data support in the debate${lang === 'pt' ? '\n- Write summary and stat labels in Brazilian Portuguese' : ''}`,
        },
      ],
      temperature: 0.3,
      maxOutputTokens: 400,
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
