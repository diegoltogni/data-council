'use client';

import dynamic from 'next/dynamic';
import { agents } from '@/lib/agents';
import { ChatMessage as ChatMessageType } from '@/lib/types';

const ChartBubble = dynamic(
  () => import('./ChartBubble').then((mod) => mod.ChartBubble),
  { ssr: false, loading: () => <div className="h-[180px] bg-[#111b21] rounded-xl animate-pulse my-2" /> }
);

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Strip markdown artifacts that Claude sometimes adds despite instructions */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/`(.*?)`/g, '$1')         // `code`
    .replace(/^#+\s*/gm, '')           // # headings
    .replace(/^[-*]\s+/gm, '')         // - bullet points
    .trim();
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const agent = agents[message.agentId];
  const isClosing = message.isClosing;
  const isStreaming = message.isStreaming;

  return (
    <div className="flex items-start gap-2 px-3 py-1 message-appear">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#2a3942] flex-shrink-0 flex items-center justify-center text-sm">
        {agent.emoji}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] min-w-[120px] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm ${
          isClosing ? 'closing-message' : 'bg-[#202c33]'
        }`}
      >
        {/* Agent name */}
        <p
          className={`font-medium mb-0.5 ${isClosing ? 'text-xs' : 'text-xs'}`}
          style={{ color: agent.color }}
        >
          {isClosing && '✦ '}
          {agent.name}
          {isClosing && ' — Final Verdict'}
        </p>

        {/* Content parts */}
        {message.content.map((part, i) => (
          <div key={i}>
            {part.type === 'text' && (
              <p
                className={`text-[#e9edef] leading-[1.4rem] whitespace-pre-wrap ${
                  isClosing ? 'text-[14px]' : 'text-[13.5px]'
                } ${isStreaming && i === message.content.length - 1 ? 'streaming-cursor' : ''}`}
              >
                {stripMarkdown(part.text)}
              </p>
            )}
            {part.type === 'chart' && <ChartBubble data={part.chartData} agentColor={agent.color} />}
          </div>
        ))}

        {/* Timestamp */}
        {!isStreaming && (
          <p className="text-[10px] text-[#8696a0] text-right mt-0.5 -mb-0.5">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
