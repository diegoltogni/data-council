import { AgentId } from './types';

export const TIMING = {
  /** Minimum delay before typing indicator appears (ms) */
  PRE_TYPING_MIN: 2000,
  /** Maximum delay before typing indicator appears (ms) */
  PRE_TYPING_MAX: 4000,
  /** Delay after a message completes — let the reader absorb (ms) */
  POST_MESSAGE: 1200,
  /** Extra pause before the closing message for dramatic effect (ms) */
  CLOSING_PAUSE: 2500,
  /** Reduction in pre-typing delay for "hot take" (fastest retort) */
  HOT_TAKE_SPEED_BOOST: 600,
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
  'Pele vs Maradona',
  'SQL vs Python',
  'Dashboards vs AI agents',
  'AI vs Humans',
] as const;

export const API_KEY_STORAGE_KEY = 'data-council-api-key';
