'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Language, LABELS } from './i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof LABELS['en'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: LABELS.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: LABELS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-[#202c33] rounded-full p-0.5 border border-[#2a3942]">
      <button
        onClick={() => setLang('en')}
        className={`text-sm px-2 py-1 rounded-full transition-all ${
          lang === 'en' ? 'bg-[#2a3942] shadow-sm' : 'opacity-50 hover:opacity-80'
        }`}
        title="English"
      >
        🇺🇸
      </button>
      <button
        onClick={() => setLang('pt')}
        className={`text-sm px-2 py-1 rounded-full transition-all ${
          lang === 'pt' ? 'bg-[#2a3942] shadow-sm' : 'opacity-50 hover:opacity-80'
        }`}
        title="Portugues"
      >
        🇧🇷
      </button>
    </div>
  );
}
