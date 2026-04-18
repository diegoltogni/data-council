import { AgentId } from './types';

/** Per-agent thinking delay ranges (ms) — minimal artificial pause, API latency does the rest */
export const AGENT_TIMING: Record<AgentId, { min: number; max: number }> = {
  moderator: { min: 100, max: 300 },
  quant: { min: 200, max: 500 },
  'eye-test': { min: 150, max: 400 },
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
  'eye-test',
  'historian',
  'hot-take',
]);

export const PRESET_TOPICS = [
  'Jordan vs LeBron',
  'Messi vs Ronaldo',
  'Trump vs Obama',
  'Elon vs Zuckerberg',
  'Remote vs Office',
  'Build vs Buy',
  'Dashboards vs AI Agents',
  'SQL vs Python',
] as const;

export const API_KEY_STORAGE_KEY = 'data-council-api-key';
