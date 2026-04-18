import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { agents } from '@/lib/agents';
import { AgentId } from '@/lib/types';
import { VALID_AGENT_IDS, LIMITS } from '@/lib/constants';

export const maxDuration = 60;

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

  const { agentId, conversationHistory, topic, isOpening, isClosing } = body as {
    agentId: string;
    conversationHistory?: string;
    topic: string;
    isOpening?: boolean;
    isClosing?: boolean;
  };

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

  let userMessage: string;
  if (isOpening) {
    userMessage = `The topic for today's council discussion is: "${topic}"\n\nOpen the discussion with ONE punchy sentence that frames the debate and provokes the analysts to take sides.`;
  } else if (isClosing) {
    userMessage = `Here's the full discussion:\n\n${history}\n\nDeliver the council's VERDICT. Which side won this debate? Be specific — name the answer and the single strongest data point or argument that decided it. This is a ruling, not a "both sides have merit" cop-out. One sentence.`;
  } else {
    userMessage = `Here's the discussion so far:\n\n${history}\n\nIt's your turn. React to the data and arguments above. If someone made a strong point, acknowledge it. If you're changing your mind, say so. The council is working toward a verdict. Stay in character. ONE sentence.`;
  }

  try {
    const client = createAnthropic({ apiKey });

    const result = streamText({
      model: client('claude-sonnet-4-20250514'),
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.9,
      maxOutputTokens: 180,
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
