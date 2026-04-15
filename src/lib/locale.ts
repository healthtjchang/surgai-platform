import zhTW from '@/messages/zh-TW.json';
import en from '@/messages/en.json';

export type Locale = 'zh-TW' | 'en';

const messages: Record<Locale, typeof zhTW> = {
  'zh-TW': zhTW,
  en: en as typeof zhTW,
};

export function getMessages(locale: Locale) {
  return messages[locale] || messages['zh-TW'];
}

export function t(locale: Locale, path: string): string {
  const msgs = getMessages(locale);
  const keys = path.split('.');
  let result: unknown = msgs;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}
