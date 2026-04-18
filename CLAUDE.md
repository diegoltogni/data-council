# The Data Council

Next.js 16 app where 5 AI analyst agents debate any topic in real-time.
WhatsApp-style dark chat UI with streaming text and inline Recharts charts.

## Key Files

- `app/api/council/route.ts` — streaming Claude API proxy with hybrid key resolution
- `app/api/health/route.ts` — API key availability check
- `components/Council.tsx` — debate orchestration, streaming consumption, chat UI
- `components/ChatMessage.tsx` — individual message bubble (text + charts)
- `components/ChartBubble.tsx` — Recharts chart rendered in a message
- `components/ApiKeySetup.tsx` — browser-side API key input
- `components/ErrorBoundary.tsx` — React crash boundary
- `lib/agents.ts` — agent personalities and system prompts
- `lib/types.ts` — TypeScript types (discriminated unions)
- `lib/constants.ts` — timing, limits, presets
- `lib/analytics.ts` — Vercel Analytics event tracking

## Conventions

- All components are client components (`'use client'`)
- WhatsApp dark theme: `#0b141a` (bg), `#202c33` (cards), `#2a3942` (borders)
- Agent colors defined in `lib/agents.ts`
- State: React `useState` + `useRef` (no external state management)
- Streaming: API returns `text/plain` stream, client reads with `ReadableStream`
- Charts: agents include `[CHART]{...}[/CHART]` in text, parsed after streaming completes
- API key: server env var takes priority, falls back to user-provided key via `X-API-Key` header
