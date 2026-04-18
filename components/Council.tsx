'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { agents, AGENT_ORDER } from '@/lib/agents';
import { AgentId, ChartData, ChatMessage as ChatMessageType, MessageContent, ScorecardData } from '@/lib/types';
import { TIMING, AGENT_TIMING, LIMITS, API_KEY_STORAGE_KEY } from '@/lib/constants';
import { events } from '@/lib/analytics';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { Scorecard } from './Scorecard';

// ── Helpers ──

/** Find the closing brace that matches the opening brace at `start` */
function findMatchingBrace(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Try to find and extract chart JSON from anywhere in a text string */
function extractInlineChart(text: string): { before: string; chartData: ChartData; after: string } | null {
  const chartStart = text.search(/\{\s*"type"\s*:\s*"(?:bar|line|radar)"/);
  if (chartStart === -1) return null;

  const end = findMatchingBrace(text, chartStart);
  if (end === -1) return null;

  try {
    const data = JSON.parse(text.slice(chartStart, end));
    if (data.type && data.labels && data.datasets) {
      return {
        before: text.slice(0, chartStart).trim(),
        chartData: data,
        after: text.slice(end).trim(),
      };
    }
  } catch { /* malformed JSON */ }
  return null;
}

function parseMessageContent(text: string): MessageContent[] {
  // 1. Try tag-based parsing first: [CHART]...[/CHART]
  if (text.includes('[CHART]') && text.includes('[/CHART]')) {
    const parts: MessageContent[] = [];
    const segments = text.split(/\[CHART\]|\[\/CHART\]/);
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      try {
        const data = JSON.parse(trimmed);
        if (data.type && data.labels && data.datasets) {
          parts.push({ type: 'chart', chartData: data });
          continue;
        }
      } catch { /* not JSON */ }
      parts.push({ type: 'text', text: trimmed });
    }
    if (parts.length > 0) return parts;
  }

  // 2. Fallback: detect inline chart JSON without tags
  const extracted = extractInlineChart(text);
  if (extracted) {
    const parts: MessageContent[] = [];
    if (extracted.before) parts.push({ type: 'text', text: extracted.before });
    parts.push({ type: 'chart', chartData: extracted.chartData });
    if (extracted.after) parts.push({ type: 'text', text: extracted.after });
    return parts;
  }

  // 3. Pure text
  return [{ type: 'text', text }];
}

/** Strip chart JSON/tags from text for conversation history */
function cleanRawText(text: string): string {
  let cleaned = text.replace(/\[CHART\][\s\S]*?\[\/CHART\]/g, '[chart]');
  const extracted = extractInlineChart(cleaned);
  if (extracted) {
    cleaned = [extracted.before, '[chart]', extracted.after].filter(Boolean).join(' ');
  }
  return cleaned.trim();
}

function getPreTypingDelay(agentId: AgentId, isClosing?: boolean): number {
  if (isClosing) return TIMING.CLOSING_PAUSE;
  const { min, max } = AGENT_TIMING[agentId];
  return min + Math.random() * (max - min);
}

function getPostMessageDelay(agentId: AgentId, hasChart: boolean): number {
  if (hasChart) return TIMING.POST_CHART;
  if (agentId === 'moderator') return TIMING.POST_MODERATOR;
  return TIMING.POST_TEXT;
}

function buildHistory(messages: ChatMessageType[]): string {
  const recent = messages.slice(-LIMITS.MAX_HISTORY_MESSAGES);
  return recent
    .filter((m) => m.rawText && m.rawText !== '[error]')
    .map((m) => `[${agents[m.agentId].name}]: ${m.rawText}`)
    .join('\n\n');
}

function getErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong';
  const msg = err.message.toLowerCase();
  if (msg.includes('api key') || msg.includes('401') || msg.includes('auth'))
    return 'Invalid API key — please check your key and try again.';
  if (msg.includes('429') || msg.includes('rate'))
    return 'Rate limited — the council needs a moment. Try again shortly.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error — check your connection.';
  return 'Something went wrong. Try again?';
}

function getUserApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

// ── Component ──

interface Props {
  topic: string;
  onReset: () => void;
}

export function Council({ topic, onReset }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [typingAgent, setTypingAgent] = useState<AgentId | null>(null);
  const [status, setStatus] = useState<'running' | 'finished'>('running');
  const [copied, setCopied] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const messagesRef = useRef<ChatMessageType[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const transcript = useMemo(() => {
    return messages
      .filter((m) => m.rawText && m.rawText !== '[error]')
      .map((m) => {
        const agent = agents[m.agentId];
        const prefix = m.isClosing ? `${agent.emoji} ${agent.name} — VERDICT` : `${agent.emoji} ${agent.name}`;
        return `${prefix}: ${m.rawText}`;
      })
      .join('\n\n');
  }, [messages]);

  const copyTranscript = useCallback(async () => {
    const header = `The Data Council\nTopic: ${topic}\n${'—'.repeat(30)}\n\n`;
    const footer = `\n\n${'—'.repeat(30)}\nPowered by The Data Council — thedatacouncil.ai`;
    try {
      await navigator.clipboard.writeText(header + transcript + footer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  }, [transcript, topic]);

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    // Only auto-scroll if user is near the bottom (within 200px)
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 200) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingAgent, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;

    const delay = (ms: number) =>
      new Promise<void>((r) => {
        const id = setTimeout(r, ms);
        if (cancelled) clearTimeout(id);
      });

    async function addAgentMessage(
      agentId: AgentId,
      isOpening = false,
      isClosing = false
    ) {
      if (cancelled) return;

      // Pre-typing delay
      await delay(getPreTypingDelay(agentId, isClosing));
      if (cancelled) return;

      // Show typing indicator
      setTypingAgent(agentId);

      const history = buildHistory(messagesRef.current);
      const userApiKey = getUserApiKey();

      try {
        const res = await fetch('/api/council', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userApiKey ? { 'X-API-Key': userApiKey } : {}),
          },
          body: JSON.stringify({
            agentId,
            conversationHistory: history,
            topic,
            isOpening,
            isClosing,
          }),
        });

        // Non-streaming error (401, 400, etc.)
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        // ── Collect full stream (typing indicator stays visible) ──
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          fullText += decoder.decode(value, { stream: true });
        }

        if (cancelled) return;
        if (!fullText.trim()) throw new Error('No response — check your API key');

        // ── Parse content (charts + text) before revealing anything ──
        const finalContent = parseMessageContent(fullText);

        // ── Create message bubble, remove typing indicator ──
        setTypingAgent(null);

        const liveMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          agentId,
          content: [{ type: 'text', text: '' }],
          rawText: '',
          timestamp: new Date(),
          isStreaming: true,
          isClosing: isClosing || undefined,
        };
        messagesRef.current = [...messagesRef.current, liveMessage];
        if (!cancelled) setMessages([...messagesRef.current]);

        // ── Reveal content part by part — letter by letter with typos ──
        const revealedContent: MessageContent[] = [];

        for (const part of finalContent) {
          if (cancelled) break;

          if (part.type === 'chart') {
            revealedContent.push(part);
            updateLiveMessage(revealedContent, true);
            await delay(TIMING.CHART_REVEAL_PAUSE);
          } else {
            revealedContent.push({ type: 'text', text: '' });
            const textIdx = revealedContent.length - 1;
            const chars = part.text;
            let displayed = '';
            let i = 0;

            while (i < chars.length) {
              if (cancelled) break;

              // ~0.7% chance per char — roughly 5 typos across the whole debate
              const shouldTypo = Math.random() < 0.007
                && /[a-zA-Z]/.test(chars[i])
                && i > 0 && /[a-zA-Z]/.test(chars[i - 1])
                && i + 2 < chars.length; // need room to type ahead

              if (shouldTypo) {
                const alphabet = 'abcdefghijklmnopqrstuvwxyz';

                // 1. Type wrong letter at normal speed
                const typoChar = alphabet[Math.floor(Math.random() * 26)];
                displayed += typoChar;
                revealedContent[textIdx] = { type: 'text', text: displayed };
                updateLiveMessage(revealedContent, true);
                await delay(TIMING.CHAR_REVEAL_MIN + Math.random() * (TIMING.CHAR_REVEAL_MAX - TIMING.CHAR_REVEAL_MIN));

                // 2. Type 1-2 more chars before noticing (humans don't catch instantly)
                const extraChars = 1 + Math.floor(Math.random() * 2);
                for (let e = 0; e < extraChars && i + e < chars.length; e++) {
                  displayed += alphabet[Math.floor(Math.random() * 26)];
                  revealedContent[textIdx] = { type: 'text', text: displayed };
                  updateLiveMessage(revealedContent, true);
                  await delay(TIMING.CHAR_REVEAL_MIN + Math.random() * (TIMING.CHAR_REVEAL_MAX - TIMING.CHAR_REVEAL_MIN));
                }

                // 3. Pause — the "wait..." moment
                await delay(TIMING.TYPO_NOTICE_MIN + Math.random() * (TIMING.TYPO_NOTICE_MAX - TIMING.TYPO_NOTICE_MIN));

                // 4. Delete chars one by one (backspace is fast)
                const charsToDelete = 1 + extraChars;
                for (let d = 0; d < charsToDelete; d++) {
                  displayed = displayed.slice(0, -1);
                  revealedContent[textIdx] = { type: 'text', text: displayed };
                  updateLiveMessage(revealedContent, true);
                  await delay(TIMING.CHAR_DELETE_SPEED);
                }
              }

              // Type correct letter
              displayed += chars[i];
              revealedContent[textIdx] = { type: 'text', text: displayed };
              updateLiveMessage(revealedContent, true);

              // Variable speed: faster mid-word, slower after spaces/punctuation
              if (chars[i] === ' ') {
                await delay(TIMING.CHAR_SPACE_PAUSE + Math.random() * 40);
              } else if (/[.,!?—]/.test(chars[i])) {
                await delay(TIMING.CHAR_PUNCT_PAUSE + Math.random() * 60);
              } else {
                await delay(TIMING.CHAR_REVEAL_MIN + Math.random() * (TIMING.CHAR_REVEAL_MAX - TIMING.CHAR_REVEAL_MIN));
              }

              i++;
            }
          }
        }

        // ── Finalize ──
        if (!cancelled) {
          const idx = messagesRef.current.length - 1;
          messagesRef.current[idx] = {
            ...messagesRef.current[idx],
            content: finalContent,
            rawText: cleanRawText(fullText),
            isStreaming: false,
          };
          setMessages([...messagesRef.current]);
        }

        function updateLiveMessage(content: MessageContent[], streaming: boolean) {
          const idx = messagesRef.current.length - 1;
          messagesRef.current[idx] = {
            ...messagesRef.current[idx],
            content: [...content],
            isStreaming: streaming,
          };
          setMessages([...messagesRef.current]);
        }
      } catch (err) {
        if (cancelled) return;
        setTypingAgent(null);

        const errorMsg: ChatMessageType = {
          id: crypto.randomUUID(),
          agentId,
          content: [{ type: 'text', text: getErrorMessage(err) }],
          rawText: '[error]',
          timestamp: new Date(),
        };
        messagesRef.current = [...messagesRef.current, errorMsg];
        setMessages([...messagesRef.current]);
      }

      // Post-message pause — longer after charts, shorter after text
      if (!cancelled) {
        const hasChart = messagesRef.current[messagesRef.current.length - 1]
          ?.content.some((c) => c.type === 'chart');
        await delay(getPostMessageDelay(agentId, hasChart));
      }
    }

    async function runCouncil() {
      events.debateStarted(topic);

      // Round 1: Moderator opens
      await addAgentMessage('moderator', true);

      // Round 1: Each analyst weighs in
      for (const agentId of AGENT_ORDER) {
        if (cancelled) return;
        await addAgentMessage(agentId);
      }

      // Round 2: Moderator stirs the pot
      if (cancelled) return;
      await addAgentMessage('moderator');

      // Round 2: Pick 2 analysts for a focused exchange (keeps it tight)
      const round2Picks = [...AGENT_ORDER].sort(() => Math.random() - 0.5).slice(0, 2);
      for (const agentId of round2Picks) {
        if (cancelled) return;
        await addAgentMessage(agentId);
      }

      // Closing: Moderator wraps up
      if (cancelled) return;
      await addAgentMessage('moderator', false, true);

      if (!cancelled) {
        setStatus('finished');
        events.debateCompleted(topic, messagesRef.current.length);

        // Extract winner from the moderator's closing message
        const closingMsg = messagesRef.current[messagesRef.current.length - 1];
        const winnerMatch = closingMsg?.rawText?.match(/🏆\s*(.+)/);
        const verdictWinner = winnerMatch
          ? winnerMatch[1].trim().split('\n')[0].trim()
          : '';

        // Generate scorecard in the background — pass the verdict winner for consistency
        const transcript = messagesRef.current
          .filter((m) => m.rawText && m.rawText !== '[error]')
          .map((m) => `[${agents[m.agentId].name}]: ${m.rawText}`)
          .join('\n\n');

        const userApiKey = getUserApiKey();
        fetch('/api/scorecard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userApiKey ? { 'X-API-Key': userApiKey } : {}),
          },
          body: JSON.stringify({ topic, transcript, winner: verdictWinner }),
        })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => { if (data && !cancelled) setScorecard(data); })
          .catch(() => {});
      }
    }

    runCouncil();

    return () => {
      cancelled = true;
    };
  }, [topic]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-[#2a3942] flex-shrink-0">
        <button
          onClick={onReset}
          className="text-[#8696a0] hover:text-[#e9edef] transition-colors"
          title="Back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex -space-x-1.5">
          {Object.values(agents).map((agent) => (
            <div
              key={agent.id}
              className={`w-7 h-7 rounded-full bg-[#2a3942] flex items-center justify-center text-xs border-2 border-[#202c33] transition-all duration-300 ${
                typingAgent === agent.id ? 'scale-110' : ''
              }`}
              style={
                typingAgent === agent.id
                  ? {
                      boxShadow: `0 0 0 2px ${agent.color}, 0 0 10px ${agent.color}50`,
                    }
                  : undefined
              }
            >
              {agent.emoji}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0 ml-1">
          <h2 className="text-[#e9edef] text-sm font-medium">The Data Council</h2>
          <p className="text-[#8696a0] text-[11px] truncate">
            {status === 'running'
              ? typingAgent
                ? `${agents[typingAgent].name} is speaking...`
                : `${messages.length} messages`
              : `Verdict delivered · ${messages.length} messages`}
          </p>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto chat-bg px-1 py-3">
        {/* Topic badge */}
        <div className="flex justify-center mb-3">
          <div className="bg-[#182229] text-[#8696a0] text-[11px] px-4 py-1.5 rounded-lg max-w-[85%] text-center leading-relaxed">
            {topic}
          </div>
        </div>

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {typingAgent && <TypingIndicator agentId={typingAgent} />}

        {/* Scorecard */}
        {scorecard && <Scorecard data={scorecard} topic={topic} />}

        <div ref={chatEndRef} />
      </div>

      {/* ── Bottom bar ── */}
      {status === 'finished' && (
        <div className="bg-[#202c33] px-4 py-3 border-t border-[#2a3942] flex items-center justify-center gap-3 flex-shrink-0 fade-in">
          <button
            onClick={copyTranscript}
            className="border border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:border-[#3b4a54] px-5 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                Copy Transcript
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="bg-[#00a884] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#00c49a] transition-colors"
          >
            New Topic
          </button>
        </div>
      )}
    </div>
  );
}
