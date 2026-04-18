'use client';

import { useState, useCallback } from 'react';
import { ScorecardData } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: ScorecardData;
  topic: string;
}

export function Scorecard({ data, topic }: Props) {
  const { t } = useLanguage();
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
    <div className="mx-3 my-4 slide-up">
      <div className="bg-[#111b21] rounded-2xl overflow-hidden border border-[#2a3942] shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00a884]/20 via-[#53bdeb]/10 to-[#f5c842]/20 px-5 pt-5 pb-4 text-center">
          <p className="text-[9px] text-[#8696a0] tracking-[0.2em] uppercase font-medium mb-1.5">
            The Data Council
          </p>
          <p className="text-[14px] text-[#e9edef] font-medium">
            {data.topicShort || topic}
          </p>
        </div>

        {/* Winner announcement */}
        <div className="text-center pt-5 pb-4">
          <p className="text-[32px] font-bold text-[#e9edef] leading-none tracking-tight">
            🏆 {data.winner}
          </p>
        </div>

        {/* 2x2 Stat cards */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {data.stats.slice(0, 4).map((stat, i) => (
            <div
              key={i}
              className="bg-[#1a2730] rounded-xl p-3 text-center border border-[#1e2d36]"
            >
              <p className="text-[9px] text-[#667781] uppercase tracking-wider mb-2 font-medium">
                {stat.label}
              </p>
              <p className="text-[22px] font-bold text-[#00a884] leading-none mb-1.5">
                {stat.winner_value}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-[#667781]">{data.loser}</span>
                <span className="text-[12px] text-[#8696a0] font-medium">
                  {stat.loser_value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-5 pb-4">
          <p className="text-[12px] text-[#8696a0] italic text-center leading-relaxed">
            &ldquo;{data.summary}&rdquo;
          </p>
        </div>

        {/* Footer + Share */}
        <div className="bg-[#0d1820] px-5 py-3 flex items-center justify-between border-t border-[#1a2730]">
          <p className="text-[9px] text-[#556770]">
            ⚡ thedatacouncil.ai
          </p>
          <button
            onClick={shareText}
            className="text-[11px] text-[#00a884] hover:text-[#00c49a] font-medium transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                {t.copied}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                {t.shareScorecard}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
