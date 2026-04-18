import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { agents } from '@/lib/agents';
import { AgentId } from '@/lib/types';
import { VALID_AGENT_IDS, LIMITS } from '@/lib/constants';

export const maxDuration = 60;

// ── Rate limiting: 3 debates per IP per hour ──
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_DEBATES_PER_WINDOW = 3;
const ipDebateCount = new Map<string, { count: number; windowStart: number }>();

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipDebateCount.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    ipDebateCount.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_DEBATES_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_DEBATES_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_DEBATES_PER_WINDOW - entry.count };
}

// Clean up stale entries every 10 minutes
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [ip, entry] of ipDebateCount) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW) ipDebateCount.delete(ip);
    }
  };
  if (!(globalThis as Record<string, unknown>).__rateLimitCleanup) {
    (globalThis as Record<string, unknown>).__rateLimitCleanup = true;
    setInterval(cleanup, 10 * 60 * 1000);
  }
}

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
    return Response.json(
      { error: 'API key not configured', code: 'MISSING_API_KEY' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { agentId, conversationHistory, topic, isOpening, isClosing, lang } = body as {
    agentId: string;
    conversationHistory?: string;
    topic: string;
    isOpening?: boolean;
    isClosing?: boolean;
    lang?: string;
  };

  // Rate limit: check on debate start (opening message only)
  // Users who bring their own API key skip rate limiting
  const usingServerKey = !req.headers.get('x-api-key');
  if (isOpening && usingServerKey) {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return Response.json(
        {
          error: `You've used all ${MAX_DEBATES_PER_WINDOW} free debates this hour. Add your own API key to continue.`,
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: { 'Retry-After': '3600' },
        }
      );
    }
  }

  if (!agentId || !VALID_AGENT_IDS.has(agentId as AgentId)) {
    return Response.json({ error: 'Invalid agent' }, { status: 400 });
  }

  if (!topic || typeof topic !== 'string' || topic.length > LIMITS.MAX_TOPIC_LENGTH) {
    return Response.json({ error: 'Invalid topic' }, { status: 400 });
  }

  const history =
    typeof conversationHistory === 'string'
      ? conversationHistory.slice(0, LIMITS.MAX_HISTORY_LENGTH)
      : '';

  const agent = agents[agentId as AgentId];
  const langInstruction = lang === 'pt'
    ? '\n\nIMPORTANT: Respond ENTIRELY in Brazilian Portuguese. All text, chart titles, subtitles, and labels must be in Portuguese. Keep your personality and style but write in Portuguese.'
    : '';

  let userMessage: string;
  if (isOpening) {
    userMessage = `The topic for today's council discussion is: "${topic}"\n\nOpen the discussion with ONE punchy sentence that frames the debate and provokes the analysts to take sides.`;
  } else if (isClosing) {
    userMessage = `Topic: "${topic}"\n\nHere's the full discussion:\n\n${history}\n\nDeliver the council's conclusion. Format it EXACTLY like this:\n\n🏆 [SUBJECT NAME]\n[One sentence explaining why]\n\nCRITICAL: The winner MUST be one of the actual debate subjects (e.g. "Jordan", "LeBron", "Python", "Trump") — NEVER an analyst name like "The Quant" or "The Hot Take". You are announcing which SIDE of the debate won, not which analyst argued best.`;
  } else {
    userMessage = `Here's the discussion so far:\n\n${history}\n\nIt's your turn. React to the data and arguments above. If someone made a strong point, acknowledge it. If you're changing your mind, say so. The council is working toward a verdict. Stay in character. ONE sentence.`;
  }

  try {
    const client = createAnthropic({ apiKey });

    const result = streamText({
      model: client('claude-sonnet-4-20250514'),
      system: agent.systemPrompt + langInstruction,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.9,
      maxOutputTokens: 500,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[council] Error:', error);
    const msg = error instanceof Error ? error.message : '';
    const is401 = msg.includes('401') || msg.includes('auth') || msg.includes('key');
    return Response.json(
      {
        error: is401 ? 'Invalid API key' : 'Failed to generate response',
        code: is401 ? 'INVALID_API_KEY' : 'GENERATION_ERROR',
      },
      { status: is401 ? 401 : 500 }
    );
  }
}
