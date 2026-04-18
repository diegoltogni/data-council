'use client';

import { agents } from '@/lib/agents';
import { AgentId } from '@/lib/types';

export function TypingIndicator({ agentId }: { agentId: AgentId }) {
  const agent = agents[agentId];

  return (
    <div className="flex items-start gap-2 px-3 py-1 message-appear">
      <div
        className="w-8 h-8 rounded-full bg-[#2a3942] flex-shrink-0 flex items-center justify-center text-sm agent-spotlight"
        style={{ '--spotlight-color': agent.color } as React.CSSProperties}
      >
        {agent.emoji}
      </div>
      <div className="bg-[#202c33] rounded-2xl rounded-tl-sm px-3 py-2">
        <p className="text-xs font-medium mb-1" style={{ color: agent.color }}>
          {agent.name}
        </p>
        <div className="flex items-center gap-1.5 py-1 px-1">
          <div className="w-2 h-2 rounded-full bg-[#8696a0] typing-dot-1" />
          <div className="w-2 h-2 rounded-full bg-[#8696a0] typing-dot-2" />
          <div className="w-2 h-2 rounded-full bg-[#8696a0] typing-dot-3" />
        </div>
      </div>
    </div>
  );
}
