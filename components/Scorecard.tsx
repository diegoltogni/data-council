'use client';

import { useState, useCallback } from 'react';
import { ScorecardData } from '@/lib/types';

interface Props {
  data: ScorecardData;
  topic: string;
}

export function Scorecard({ data, topic }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = useCallback(() => {
    const lines = [
      `⚡ THE DATA COUNCIL`,
      `${data.topicShort || topic}`,
      ``,
      `🏆 ${data.winner.toUpperCase()}`,
      ``,
      ...data.stats.map(
        (s) => `${s.label}: ${data.winner} ${s.winner_value} vs ${data.loser} ${s.loser_value}`
      ),
      ``,
      `"${data.summary}"`,
      ``,
      `Try it yourself → thedatacouncil.ai`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data, topic]);

  return (
    <div className="mx-3 my-3 slide-up">
      <div className="bg-[#111b21] rounded-2xl overflow-hidden border border-[#2a3942] shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00a884]/20 to-[#53bdeb]/20 px-5 pt-4 pb-3 text-center">
          <p className="text-[10px] text-[#8696a0] tracking-widest uppercase font-medium mb-1">
            The Data Council
          </p>
          <p className="text-[13px] text-[#e9edef] font-medium">{data.topicShort || topic}</p>
        </div>

        {/* Winner */}
        <div className="text-center py-4">
          <p className="text-[28px] font-bold text-[#e9edef] leading-none">
            🏆 {data.winner}
          </p>
        </div>

        {/* Stats table */}
        <div className="px-5 pb-3">
          {/* Column headers */}
          <div className="flex items-center text-[10px] text-[#667781] uppercase tracking-wider mb-2 px-1">
            <span className="flex-1" />
            <span className="w-16 text-right font-medium" style={{ color: '#00a884' }}>
              {data.winner}
            </span>
            <span className="w-16 text-right font-medium">
              {data.loser}
            </span>
          </div>

          {/* Stat rows */}
          {data.stats.map((stat, i) => {
            const winnerNum = parseFloat(stat.winner_value);
            const loserNum = parseFloat(stat.loser_value);
            const winnerIsHigher = !isNaN(winnerNum) && !isNaN(loserNum) && winnerNum >= loserNum;

            return (
              <div
                key={i}
                className="flex items-center py-2 border-t border-[#1e2d36]"
              >
                <span className="flex-1 text-[12px] text-[#8696a0]">
                  {stat.label}
                </span>
                <span
                  className="w-16 text-right text-[13px] font-semibold"
                  style={{ color: winnerIsHigher ? '#00a884' : '#e9edef' }}
                >
                  {stat.winner_value}
                </span>
                <span className="w-16 text-right text-[13px] text-[#8696a0]">
                  {stat.loser_value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="px-5 pb-4">
          <p className="text-[12px] text-[#8696a0] italic text-center leading-relaxed">
            &ldquo;{data.summary}&rdquo;
          </p>
        </div>

        {/* Footer + Share */}
        <div className="bg-[#0b141a] px-5 py-3 flex items-center justify-between">
          <p className="text-[9px] text-[#667781]">
            ⚡ thedatacouncil.ai
          </p>
          <button
            onClick={shareText}
            className="text-[11px] text-[#00a884] hover:text-[#00c49a] font-medium transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                Share Scorecard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
