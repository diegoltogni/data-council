import { track } from '@vercel/analytics';

function safeTrack(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

export const events = {
  topicSelected: (topic: string, isCustom: boolean) =>
    safeTrack('topic_selected', { topic: topic.slice(0, 100), is_custom: isCustom }),

  debateStarted: (topic: string) =>
    safeTrack('debate_started', { topic: topic.slice(0, 100) }),

  debateCompleted: (topic: string, messageCount: number) =>
    safeTrack('debate_completed', { topic: topic.slice(0, 100), message_count: messageCount }),

  chartRendered: (chartType: string) =>
    safeTrack('chart_rendered', { chart_type: chartType }),

  apiKeyConfigured: (method: 'server' | 'browser') =>
    safeTrack('api_key_configured', { method }),
};
