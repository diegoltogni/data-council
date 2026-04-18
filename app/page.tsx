'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Council } from '@/components/Council';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { agents, ALL_AGENTS } from '@/lib/agents';
import { pickRandomTopics, API_KEY_STORAGE_KEY } from '@/lib/constants';
import { events } from '@/lib/analytics';
import { LanguageProvider, LanguageSwitch, useLanguage } from '@/lib/LanguageContext';

const SMALL_WORDS = new Set(['vs', 'or', 'for', 'the', 'a', 'an', 'in', 'of', 'to']);

function formatTopicLabel(topic: string) {
  const words = topic.split(' ');
  return (
    <span className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5">
      {words.map((word, i) => {
        const isSmall = SMALL_WORDS.has(word.toLowerCase());
        return (
          <span
            key={i}
            className={
              isSmall
                ? 'text-[11px] text-[#667781] font-normal'
                : 'text-[15px] font-bold text-[#e9edef]'
            }
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeInner />
    </LanguageProvider>
  );
}

function HomeInner() {
  const { lang, t } = useLanguage();
  const [customTopic, setCustomTopic] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [staticTopics, setStaticTopics] = useState<string[]>(() => pickRandomTopics(6));
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [checkedKey, setCheckedKey] = useState(false);

  // Fetch trending topics
  useEffect(() => {
    fetch(`/api/topics?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.trending?.length) setTrendingTopics(data.trending);
        if (data.static?.length) setStaticTopics(data.static);
      })
      .catch(() => {});
  }, [lang]);

  // Check if API key is configured (server or browser)
  useEffect(() => {
    async function checkKey() {
      try {
        const res = await fetch('/api/health');
        const { hasServerKey } = await res.json();

        if (hasServerKey) {
          setCheckedKey(true);
          return;
        }

        // No server key — check localStorage
        const browserKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (browserKey) {
          setCheckedKey(true);
          return;
        }

        // Neither — show setup
        setNeedsApiKey(true);
        setCheckedKey(true);
      } catch {
        // Health check failed — assume no key
        setNeedsApiKey(true);
        setCheckedKey(true);
      }
    }

    checkKey();
  }, []);

  function startTopic(topic: string, isCustom: boolean) {
    events.topicSelected(topic, isCustom);
    setActiveTopic(topic);
  }

  // ── Council view ──
  if (activeTopic) {
    return (
      <div className="h-dvh flex flex-col">
        <ErrorBoundary>
          <Council
            key={activeTopic + lang}
            topic={activeTopic}
            lang={lang}
            onReset={() => setActiveTopic(null)}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // ── Landing page ──
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Language switch */}
        <div className="flex justify-end mb-2 slide-up">
          <LanguageSwitch />
        </div>

        {/* Header */}
        <div className="text-center mb-4 slide-up">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">⚡</span>
            <h1 className="text-[1.5rem] font-bold text-[#e9edef] tracking-tight">
              {t.title}
            </h1>
          </div>
          <p className="text-[#8696a0] text-xs leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Agent roster */}
        <div
          className="flex justify-center gap-3 mb-4 slide-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
        >
          {ALL_AGENTS.map((id) => {
            const agent = agents[id];
            return (
              <div key={id} className="text-center group cursor-default" title={agent.description}>
                <div className="w-11 h-11 rounded-full bg-[#202c33] flex items-center justify-center text-lg mb-1.5 border-2 border-transparent group-hover:border-[#2a3942] transition-all duration-200 group-hover:scale-110">
                  {agent.emoji}
                </div>
                <p className="text-[9px] text-[#8696a0] leading-tight group-hover:text-[#e9edef] transition-colors">
                  {agent.name.replace('The ', '')}
                </p>
              </div>
            );
          })}
        </div>

        {/* API key setup (when needed) */}
        {needsApiKey && checkedKey && (
          <ApiKeySetup
            onKeyConfigured={() => setNeedsApiKey(false)}
          />
        )}

        {/* Topic input */}
        <div
          className="mb-3 slide-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="flex-1 bg-[#2a3942] text-[#e9edef] px-4 py-3 rounded-xl border border-[#3b4a54] focus:border-[#00a884] focus:outline-none placeholder-[#667781] text-sm transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customTopic.trim()) {
                  startTopic(customTopic.trim(), true);
                }
              }}
            />
            {customTopic.trim() && (
              <button
                onClick={() => startTopic(customTopic.trim(), true)}
                className="bg-[#00a884] text-white px-4 rounded-xl hover:bg-[#00c49a] transition-colors flex items-center"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          className="flex items-center gap-3 mb-3 slide-up"
          style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}
        >
          <div className="flex-1 h-px bg-[#2a3942]" />
          <span className="text-[11px] text-[#667781]">{t.orPickTopic}</span>
          <div className="flex-1 h-px bg-[#2a3942]" />
        </div>

        {/* Topics grid: trending first, then static */}
        <div
          className="grid grid-cols-2 gap-2 slide-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          {trendingTopics.map((preset) => (
            <button
              key={preset}
              onClick={() => startTopic(preset, false)}
              className="bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] px-3 py-3.5 rounded-xl text-center transition-all duration-200 border border-[#00a884]/30 hover:border-[#00a884]/60 hover:scale-[1.03] relative"
            >
              <span className="absolute top-1.5 right-1.5 text-[7px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
                trending
              </span>
              {formatTopicLabel(preset)}
            </button>
          ))}
          {staticTopics.slice(0, 6 - trendingTopics.length).map((preset) => (
            <button
              key={preset}
              onClick={() => startTopic(preset, false)}
              className="bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] px-3 py-3.5 rounded-xl text-center transition-all duration-200 border border-[#2a3942] hover:border-[#3b4a54] hover:scale-[1.03]"
            >
              {formatTopicLabel(preset)}
            </button>
          ))}
        </div>

        {/* QR Code (desktop only) + Footer */}
        <div className="flex flex-col items-center mt-4 gap-2 slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
          <div className="hidden sm:flex flex-col items-center gap-1.5">
            <div className="bg-white p-1.5 rounded-md">
              <QRCodeSVG
                value="https://council.experiai.com"
                size={64}
                bgColor="#ffffff"
                fgColor="#0b141a"
                level="M"
              />
            </div>
            <p className="text-[9px] text-[#667781]">
              {t.scanToTry}
            </p>
          </div>
          <p className="text-[10px] text-[#667781]">
            {t.poweredBy} &middot;{' '}
            <a
              href="https://github.com/diegoltogni/data-council"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8696a0] transition-colors"
            >
              {t.openSource}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
