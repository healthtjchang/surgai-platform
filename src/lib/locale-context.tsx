'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, getMessages } from './locale';

type Messages = ReturnType<typeof getMessages>;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children, initialLocale = 'zh-TW' }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(getMessages(initialLocale));

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setMessages(getMessages(newLocale));
    if (typeof window !== 'undefined') {
      localStorage.setItem('surgai-locale', newLocale);
    }
  }, []);

  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let result: unknown = messages;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    return typeof result === 'string' ? result : path;
  }, [messages]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
