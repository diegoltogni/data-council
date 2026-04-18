'use client';

interface Props {
  topic: string;
}

export function VsBanner({ topic }: Props) {
  // Parse "A vs B" format
  const vsMatch = topic.match(/^(.+?)\s+vs\.?\s+(.+)$/i);

  if (!vsMatch) {
    // Non-vs topic — simpler display
    return (
      <div className="mx-3 my-4">
        <div className="bg-gradient-to-b from-[#1a2730] to-[#111b21] rounded-2xl border border-[#2a3942] px-5 py-6 text-center">
          <p className="text-[9px] text-[#667781] tracking-[0.2em] uppercase mb-2">The Data Council</p>
          <p className="text-[20px] font-bold text-[#e9edef] slide-up">{topic}</p>
        </div>
      </div>
    );
  }

  const left = vsMatch[1].trim();
  const right = vsMatch[2].trim();

  return (
    <div className="mx-3 my-4">
      <div className="bg-gradient-to-b from-[#1a2730] to-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden relative">
        {/* Glow effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-[#00a884]/20 to-transparent" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#53bdeb]/20 to-transparent" />
        </div>

        <div className="relative px-4 py-6">
          {/* Council label */}
          <p className="text-[8px] text-[#667781] tracking-[0.25em] uppercase text-center mb-4 vs-fade-in">
            ⚡ The Data Council
          </p>

          {/* VS matchup */}
          <div className="flex items-center justify-center gap-3">
            {/* Left fighter */}
            <div className="flex-1 text-right vs-slide-left">
              <p className="text-[22px] sm:text-[28px] font-black text-[#e9edef] uppercase tracking-tight leading-none">
                {left}
              </p>
            </div>

            {/* VS */}
            <div className="flex-shrink-0 vs-scale-in">
              <div className="w-10 h-10 rounded-full bg-[#2a3942] border border-[#3b4a54] flex items-center justify-center">
                <span className="text-[11px] font-black text-[#667781] tracking-wider">VS</span>
              </div>
            </div>

            {/* Right fighter */}
            <div className="flex-1 text-left vs-slide-right">
              <p className="text-[22px] sm:text-[28px] font-black text-[#e9edef] uppercase tracking-tight leading-none">
                {right}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-[2px] bg-gradient-to-r from-[#00a884] via-[#2a3942] to-[#53bdeb]" />
      </div>
    </div>
  );
}
