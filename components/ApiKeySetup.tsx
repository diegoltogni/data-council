'use client';

import { useState } from 'react';
import { API_KEY_STORAGE_KEY } from '@/lib/constants';
import { events } from '@/lib/analytics';

interface Props {
  onKeyConfigured: () => void;
}

export function ApiKeySetup({ onKeyConfigured }: Props) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please paste your API key');
      return;
    }
    if (trimmed.length < 10) {
      setError('That doesn\u2019t look like a valid API key');
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    events.apiKeyConfigured('browser');
    onKeyConfigured();
  }

  return (
    <div className="bg-[#182229] border border-[#2a3942] rounded-2xl p-5 mb-6 slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00a884"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <div>
          <h3 className="text-[#e9edef] text-sm font-medium mb-1">
            Bring your own API key
          </h3>
          <p className="text-[#8696a0] text-xs leading-relaxed">
            This app uses Claude to power the analysts. Paste your key below
            — it stays in your browser and is never stored on any server.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="sk-ant-..."
          className="flex-1 bg-[#2a3942] text-[#e9edef] px-3 py-2.5 rounded-xl border border-[#3b4a54] focus:border-[#00a884] focus:outline-none placeholder-[#667781] text-sm font-mono"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={handleSave}
          className="bg-[#00a884] text-white px-4 rounded-xl hover:bg-[#00c49a] transition-colors text-sm font-medium"
        >
          Save
        </button>
      </div>

      {error && <p className="text-[#ff6b6b] text-xs mt-1">{error}</p>}

      <p className="text-[#667781] text-[10px] mt-3">
        Get a key at{' '}
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00a884] hover:underline"
        >
          console.anthropic.com
        </a>
      </p>
    </div>
  );
}
