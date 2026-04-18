export type AgentId = 'moderator' | 'quant' | 'skeptic' | 'historian' | 'hot-take';

export interface Agent {
  id: AgentId;
  name: string;
  emoji: string;
  color: string;
  description: string;
  systemPrompt: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'radar';
  title: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'chart'; chartData: ChartData };

export interface ChatMessage {
  id: string;
  agentId: AgentId;
  content: MessageContent[];
  rawText: string;
  timestamp: Date;
  isStreaming?: boolean;
  isClosing?: boolean;
}

export type DebateStatus = 'idle' | 'running' | 'finished' | 'error';

export interface ScorecardData {
  topicShort: string;
  winner: string;
  loser: string;
  stats: {
    label: string;
    winner_value: string;
    loser_value: string;
  }[];
  summary: string;
}
