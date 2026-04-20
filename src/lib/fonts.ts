// ============================================================================
// Font system — ports the legacy portfolio.js font utilities to React. Handles:
//   • Building CSS `font-family` stacks with sensible fallbacks per var
//   • Loading Google Fonts on demand via dynamic <link> tags
//   • Injecting @font-face rules for user-uploaded custom fonts
// The store owns the arrays (`customFonts`, `googleFonts`) and `vibeOverrides`;
// this module is the side-effect surface that keeps the DOM in sync.
// ============================================================================

export interface CustomFont {
  name: string;
  family: string;
  url: string;
}

/** The three typography CSS variables exposed per vibe. */
export const FONT_VARS = [
  { name: '--font-display', labelKey: 'style.font.display', hintKey: 'style.font.hint.display' },
  { name: '--font-body',    labelKey: 'style.font.body',    hintKey: 'style.font.hint.body' },
  { name: '--font-script',  labelKey: 'style.font.script',  hintKey: 'style.font.hint.script' },
] as const;

/** The six color variables exposed per vibe (mirrors legacy COLOR_VARS). */
export const COLOR_VARS = [
  { name: '--accent',    labelKey: 'style.color.accent' },
  { name: '--heading',   labelKey: 'style.color.heading' },
  { name: '--page-bg',   labelKey: 'style.color.page-bg' },
  { name: '--page-fg',   labelKey: 'style.color.page-fg' },
  { name: '--fg-muted',  labelKey: 'style.color.fg-muted' },
  { name: '--surface-2', labelKey: 'style.color.surface-2' },
] as const;

/** Union of all theme CSS variables. Used to clear body styles on vibe switch. */
export const THEME_VARS: string[] = [
  ...COLOR_VARS.map(v => v.name),
  ...FONT_VARS.map(v => v.name),
];

/** Baseline font families everyone gets — mixed with custom + Google families. */
export const BASE_FONTS = [
  'Playfair Display', 'Cormorant Garamond', 'Inter', 'Bebas Neue',
  'Dancing Script', 'Be Vietnam Pro',
  'Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'system-ui',
  'ui-monospace',
];

const GENERIC = new Set(['system-ui', 'ui-monospace', 'serif', 'sans-serif', 'monospace']);

/** Build a CSS font-family value with var-specific fallbacks. */
export function buildFontStack(varName: string, family: string): string {
  const fallback =
    varName === '--font-body'
      ? '"Inter", system-ui, sans-serif'
      : varName === '--font-script'
        ? '"Cormorant Garamond", Georgia, serif'
        : 'Georgia, serif';
  const head = GENERIC.has(family) ? family : `"${family}"`;
  return `${head}, ${fallback}`;
}

/**
 * Inject a <link> tag that pulls `family` from Google Fonts. Idempotent:
 * re-calling with the same family is a no-op.
 */
export function loadGoogleFont(familyRaw: string): boolean {
  if (!familyRaw) return false;
  const family = familyRaw.trim();
  if (!family) return false;
  const id = 'gf-' + family.toLowerCase().replace(/[^a-z0-9]/g, '-');
  if (document.getElementById(id)) return true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = id;
  link.href =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}` +
    `:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
  document.head.appendChild(link);
  return true;
}

/**
 * Write an @font-face for every custom font into a single <style> tag. Rewrites
 * the tag in full — cheap, and avoids orphan rules when a font is deleted.
 */
export function injectCustomFontFaces(fonts: CustomFont[]): void {
  let tag = document.getElementById('custom-fonts-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'custom-fonts-style';
    document.head.appendChild(tag);
  }
  tag.textContent = fonts
    .map(f => `@font-face{font-family:"${f.family}";src:url("${f.url}");font-display:swap;}`)
    .join('\n');
}

/** Read a file (from an <input type=file>) as a data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.onerror = no;
    r.readAsDataURL(file);
  });
}

/** Apply override values (vibeOverrides[vibe]) onto <body>. Clears THEME_VARS first. */
export function applyThemeOverrides(overrides: Record<string, string> | undefined): void {
  THEME_VARS.forEach(v => document.body.style.removeProperty(v));
  if (!overrides) return;
  for (const [k, v] of Object.entries(overrides)) {
    if (v) document.body.style.setProperty(k, v);
  }
}

/** Merge BASE_FONTS with custom + google families, dedup + sort. */
export function allKnownFontFamilies(
  customFonts: CustomFont[],
  googleFonts: string[],
): string[] {
  const set = new Set<string>(BASE_FONTS);
  googleFonts.forEach(f => set.add(f));
  customFonts.forEach(f => set.add(f.family));
  return [...set].sort((a, b) => a.localeCompare(b));
}
