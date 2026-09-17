import { en } from './translations/en';
import { kn } from './translations/kn';
import { Language, TranslationDictionary } from './types';

export * from './types';
export { en, kn };

export const translations: Record<Language, TranslationDictionary> = {
  en,
  kn,
};

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.en;

  // 1. Direct match in active language
  let text = dict[key];

  // 2. If not found, try dot / underscore conversion
  if (!text) {
    if (key.includes('.')) {
      text = dict[key.replace(/\./g, '_')];
    } else if (key.includes('_')) {
      text = dict[key.replace(/_/g, '.')];
    }
  }

  // 3. Fallback to English dictionary
  if (!text) {
    text = translations.en[key];
    if (!text) {
      if (key.includes('.')) {
        text = translations.en[key.replace(/\./g, '_')];
      } else if (key.includes('_')) {
        text = translations.en[key.replace(/_/g, '.')];
      }
    }
  }

  // 4. Final fallback: Humanize key gracefully instead of displaying raw technical key
  if (!text) {
    const lastPart = key.includes('.') ? key.split('.').pop() || key : key;
    const stripped = lastPart.replace(/^(btn_|lbl_|txt_|msg_)/, '');
    const humanized = stripped
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    text = humanized || key;
  }

  // 5. Interpolate params: {{param}} or {param}
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
      text = text.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(paramVal));
    });
  }

  return text;
}
