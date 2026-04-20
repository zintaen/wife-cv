import type { Lang, Localized, MLStr } from '@/types/content';

const LANG_FALLBACK_ORDER: Record<Lang, Lang[]> = {
  vi: ['vi', 'en', 'zh'],
  en: ['en', 'vi', 'zh'],
  zh: ['zh', 'en', 'vi'],
};

/** Resolve a `{vi,en,zh}` bag (or plain string) to the best string for `lang`. */
export function t(value: Localized, lang: Lang): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const bag = value as MLStr;
  for (const code of LANG_FALLBACK_ORDER[lang]) {
    const v = bag[code];
    if (v && v.trim()) return v;
  }
  return '';
}

/** Get the footer name token used on every page's lower-right. */
export function footerNameForLang(name: MLStr | undefined, lang: Lang): string {
  const v = t(name, lang).trim();
  if (v) return v;
  return ({ vi: 'LÂM THANH TIỆP', en: 'LAM THANH TIEP', zh: '林青蝶' } as const)[lang];
}
