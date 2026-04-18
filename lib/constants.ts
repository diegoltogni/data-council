import { AgentId } from './types';

/** Per-agent thinking delay ranges (ms) — minimal artificial pause, API latency does the rest */
export const AGENT_TIMING: Record<AgentId, { min: number; max: number }> = {
  moderator: { min: 100, max: 300 },
  quant: { min: 200, max: 500 },
  'skeptic': { min: 150, max: 400 },
  historian: { min: 300, max: 600 },
  'hot-take': { min: 50, max: 200 },
};

export const TIMING = {
  /** Dramatic pause before the closing message (ms) */
  CLOSING_PAUSE: 1500,
  /** Post-message pause for text-only messages (ms) */
  POST_TEXT: 400,
  /** Post-message pause after a chart — let people look at it (ms) */
  POST_CHART: 1000,
  /** Post-message pause after a moderator question (ms) */
  POST_MODERATOR: 700,
  /** Character reveal speed (ms per char) */
  CHAR_REVEAL_MIN: 8,
  CHAR_REVEAL_MAX: 18,
  /** Pause after a space (between words) */
  CHAR_SPACE_PAUSE: 15,
  /** Pause after punctuation (.,!?—) */
  CHAR_PUNCT_PAUSE: 35,
  /** Backspace speed when deleting a typo (ms per char) */
  CHAR_DELETE_SPEED: 40,
  /** Pause when noticing a typo before deleting (ms) */
  TYPO_NOTICE_MIN: 250,
  TYPO_NOTICE_MAX: 400,
  /** Pause when chart appears during reveal (ms) */
  CHART_REVEAL_PAUSE: 400,
} as const;

export const LIMITS = {
  MAX_TOPIC_LENGTH: 500,
  MAX_HISTORY_LENGTH: 10000,
  MAX_HISTORY_MESSAGES: 6,
} as const;

export const VALID_AGENT_IDS = new Set<AgentId>([
  'moderator',
  'quant',
  'skeptic',
  'historian',
  'hot-take',
]);

/** Full pool of debate topics — 6 are randomly picked on each page load */
export const TOPIC_POOL = [
  // Sports
  'Jordan vs LeBron',
  'Messi vs Ronaldo',
  'Pele vs Maradona',
  'Federer vs Nadal',
  'Ali vs Tyson',
  'Brady vs Montana',
  'Senna vs Schumacher',
  // Tech & AI
  'SQL vs Python',
  'Dashboards vs AI Agents',
  'AWS vs Azure',
  'React vs Vue',
  'Monolith vs Microservices',
  'REST vs GraphQL',
  'Postgres vs MongoDB',
  // Business
  'Remote vs Office',
  'Build vs Buy',
  'Startup vs Corporate',
  'MBA vs Experience',
  'Equity vs Salary',
  'Bootstrapped vs VC-funded',
  // Culture & Politics
  'Trump vs Obama',
  'Elon vs Zuckerberg',
  'Books vs Podcasts',
  'City vs Countryside',
  'iPhone vs Android',
  'Netflix vs Cinema',
  'Bitcoin vs Gold',
] as const;

/** Brazilian topic pool */
export const TOPIC_POOL_PT = [
  // Futebol
  'Flamengo vs Palmeiras',
  'Neymar vs Vini Jr',
  'Pele vs Garrincha',
  'Corinthians vs Sao Paulo',
  'Ronaldinho vs Romario',
  'Senna vs Piquet',
  // Tech & AI
  'SQL vs Python',
  'Dashboards vs Agentes IA',
  'AWS vs Azure',
  'React vs Vue',
  // Negocios
  'Remoto vs Escritorio',
  'Startup vs Corporacao',
  'CLT vs PJ',
  'MBA vs Experiencia',
  // Cultura
  'Lula vs Bolsonaro',
  'Spotify vs Deezer',
  'iPhone vs Android',
  'Bitcoin vs Ouro',
  'SP vs Rio',
  'Acai vs Cupuacu',
] as const;

/** Pick n random items from the pool */
export function pickRandomTopics(n: number = 6, lang: string = 'en'): string[] {
  const pool = lang === 'pt' ? [...TOPIC_POOL_PT] : [...TOPIC_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

export const API_KEY_STORAGE_KEY = 'data-council-api-key';
