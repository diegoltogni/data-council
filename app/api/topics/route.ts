import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { pickRandomTopics } from '@/lib/constants';

// ── In-memory cache: one Haiku call per hour PER LANGUAGE ──
const trendingCache = new Map<string, { topics: string[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function resolveApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && key !== 'your-api-key-here' ? key : null;
}

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get('lang') || 'en';
  const staticTopics = pickRandomTopics(3, lang);

  // Check cache (per language)
  const now = Date.now();
  const cached = trendingCache.get(lang);
  if (cached && cached.topics.length > 0 && now - cached.timestamp < CACHE_TTL) {
    return Response.json(
      { trending: cached.topics, static: staticTopics },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }

  // Generate trending topics
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return Response.json({ trending: [], static: pickRandomTopics(6) });
  }

  try {
    const client = createAnthropic({ apiKey });
    const isBR = lang === 'pt';
    const regionContext = isBR
      ? `Focus on what's trending in BRAZIL — Brazilian politics, Brasileirão/Libertadores football, Brazilian culture, Brazilian tech scene. Write all topics in Portuguese. Use Brazilian names and references that a Brazilian audience would instantly recognize.`
      : `Focus on what's trending globally — US/world politics, Premier League/NBA/NFL, global tech, pop culture.`;

    const result = await generateText({
      model: client('claude-haiku-4-5-20251001'),
      system: 'You generate debate topics. Respond ONLY with a JSON array of strings, no other text.',
      messages: [
        {
          role: 'user',
          content: `Generate exactly 3 trending debate topics in "A vs B" format.

${regionContext}

Rules:
- Each topic must be "Name vs Name" format (2-4 words max)
- Make them spicy and debatable — things people genuinely argue about RIGHT NOW
- Mix categories: 1 from current events/politics, 1 from tech/business, 1 from sports/culture
- No generic evergreen topics — they must feel timely and regional

Return ONLY a JSON array like: ["Topic1 vs Topic2", "Topic3 vs Topic4", "Topic5 vs Topic6"]`,
        },
      ],
      temperature: 0.9,
      maxOutputTokens: 100,
    });

    const match = result.text.match(/\[[\s\S]*\]/);
    if (match) {
      const topics = JSON.parse(match[0]) as string[];
      if (Array.isArray(topics) && topics.length > 0) {
        trendingCache.set(lang, { topics: topics.slice(0, 3), timestamp: now });
      }
    }
  } catch (error) {
    console.error('[topics] Error generating trending:', error);
  }

  const finalTrending = trendingCache.get(lang)?.topics || [];
  return Response.json(
    { trending: finalTrending, static: staticTopics },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}
