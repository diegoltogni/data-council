'use client';

import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { ScorecardData } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  data: ScorecardData;
  topic: string;
}

export function Scorecard({ data, topic }: Props) {
  const { t } = useLanguage();
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);

    try {
      // Capture the scorecard as an image
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#111b21',
        scale: 2, // 2x for sharp retina images
        useCORS: true,
        logging: false,
      });

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('Failed to create image');

      const file = new File([blob], 'data-council-verdict.png', { type: 'image/png' });

      // Try native share with image (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${data.topicShort || topic} — The Data Council`,
          files: [file],
        });
        return;
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data-council-verdict.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // User cancelled share or error — silent
    } finally {
      setSharing(false);
    }
  }, [data, topic, sharing]);

  return (
    <div className="mx-3 my-4 slide-up">
      {/* Capture area — everything inside this ref becomes the image */}
      <div ref={captureRef} className="bg-[#111b21] rounded-2xl overflow-hidden border border-[#2a3942] shadow-2xl">
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

        {/* Branding footer (included in screenshot) */}
        <div className="bg-[#0d1820] px-5 py-2.5 border-t border-[#1a2730]">
          <p className="text-[9px] text-[#556770] text-center">
            ⚡ council.experiai.com
          </p>
        </div>
      </div>

      {/* Share button — outside capture area, not in screenshot */}
      <div className="flex justify-center mt-3">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="bg-[#00a884] hover:bg-[#00c49a] disabled:opacity-50 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
        >
          {sharing ? (
            'Generating...'
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
              {t.shareScorecard}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
