import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { VIBES, VIBE_ORDER } from '@/vibes';
import type { VibeKey } from '@/types/content';
import {
  FONT_VARS, BASE_FONTS, allKnownFontFamilies,
  buildFontStack, loadGoogleFont, injectCustomFontFaces, fileToDataUrl,
} from '@/lib/fonts';
import { listFonts, uploadFont, deleteFont } from '@/lib/api';

// Right-docked style panel. Owns the 4th grid column (see base.css).
// Vibe picker + per-vibe typography overrides. Colors remain a stub for now;
// the font surface is a full port of the legacy controls so parity holds.
export function StyleDock({ onClose }: { onClose: () => void }) {
  const lang          = useStore(s => s.lang);
  const vibe          = useStore(s => s.vibe);
  const setVibe       = useStore(s => s.setVibe);
  const overrides     = useStore(s => s.vibeOverrides);
  const setOverride   = useStore(s => s.setVibeOverride);
  const clearOverride = useStore(s => s.clearVibeOverride);
  const customFonts   = useStore(s => s.customFonts);
  const setCustomFonts = useStore(s => s.setCustomFonts);
  const googleFonts   = useStore(s => s.googleFonts);
  const addGoogleFont = useStore(s => s.addGoogleFont);
  const removeGoogleFont = useStore(s => s.removeGoogleFont);
  const showToast     = useStore(s => s.showToast);

  const activeOverrides = overrides[vibe] ?? {};
  const families = allKnownFontFamilies(customFonts, googleFonts);

  // Which family is "currently selected" for a given --font-* var?
  // If the override is a full stack like `"Inter", system-ui, sans-serif`,
  // peel the head family back out so the dropdown can display it.
  function familyFromStack(stack: string | undefined): string {
    if (!stack) return '';
    const m = stack.trim().match(/^"([^"]+)"|^([A-Za-z0-9\- ]+)/);
    return (m?.[1] ?? m?.[2] ?? '').trim();
  }

  return (
    <aside className="style-dock" aria-label="Vibe & Typography">
      <div className="style-dock__head">
        <h3>{ui(lang, 'style.title')}</h3>
        <button className="btn--xs" onClick={onClose}>{ui(lang, 'style.close')}</button>
      </div>

      <div className="style-dock__body">
        <section className="style-dock__section">
          <h4 className="style-dock__label">{ui(lang, 'style.section.preset')}</h4>

          <div className="style-dock__vibes">
            {VIBE_ORDER.map((k: VibeKey) => {
              const v = VIBES[k];
              const active = vibe === k;
              return (
                <button
                  key={k}
                  onClick={() => setVibe(k)}
                  className={'vibe-chip ' + (active ? 'is-active' : '')}
                >
                  <div className="vibe-chip__text">
                    <strong>{v.label}</strong>
                    <span>{v.suited}</span>
                  </div>
                  <div className="vibe-chip__swatches">
                    {v.swatch.slice(0, 6).map((c, i) => (
                      <span key={i} style={{ background: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="style-dock__section">
          <div className="style-dock__section-head">
            <h4 className="style-dock__label">{ui(lang, 'style.section.fonts')}</h4>
            {Object.keys(activeOverrides).some(k => k.startsWith('--font-')) && (
              <button
                className="btn--xs"
                onClick={() => {
                  FONT_VARS.forEach(f => clearOverride(vibe, f.name));
                }}
                title={ui(lang, 'style.font.reset')}
              >{ui(lang, 'style.resetFonts')}</button>
            )}
          </div>

          {FONT_VARS.map(fv => {
            const current = familyFromStack(activeOverrides[fv.name]);
            return (
              <label key={fv.name} className="style-dock__font-row">
                <span className="style-dock__font-label">
                  <strong>{ui(lang, fv.labelKey)}</strong>
                  <em>{ui(lang, fv.hintKey)}</em>
                </span>
                <select
                  className="style-dock__select"
                  value={current}
                  onChange={e => {
                    const fam = e.target.value;
                    if (!fam) clearOverride(vibe, fv.name);
                    else setOverride(vibe, fv.name, buildFontStack(fv.name, fam));
                  }}
                >
                  <option value="">— default —</option>
                  {families.map(f => (
                    <option key={f} value={f} style={{ fontFamily: buildFontStack(fv.name, f) }}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}

          <FontSourcesPanel
            customFonts={customFonts}
            setCustomFonts={setCustomFonts}
            googleFonts={googleFonts}
            addGoogleFont={addGoogleFont}
            removeGoogleFont={removeGoogleFont}
            onToast={showToast}
          />
        </section>

        <section className="style-dock__section">
          <h4 className="style-dock__label">{ui(lang, 'style.section.colors')}</h4>
          <p className="style-dock__note">
            Per-vibe color overrides — coming in the next iteration. For now, each vibe ships a
            curated palette keyed to its moodboard entry.
          </p>
        </section>
      </div>
    </aside>
  );
}

// --------------------------------------------------------- font sources panel
/** Upload custom fonts + pull Google Fonts in one collapsible block. */
function FontSourcesPanel(props: {
  customFonts: { name: string; family: string; url: string }[];
  setCustomFonts: (fonts: { name: string; family: string; url: string }[]) => void;
  googleFonts: string[];
  addGoogleFont: (f: string) => void;
  removeGoogleFont: (f: string) => void;
  onToast: (msg: string, kind?: 'ok' | 'err') => void;
}) {
  const lang = useStore(s => s.lang);
  const [family, setFamily] = useState('');
  const [gfInput, setGfInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the @font-face <style> tag in sync whenever the customFonts list moves.
  useEffect(() => { injectCustomFontFaces(props.customFonts); }, [props.customFonts]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fam = family.trim() || file.name.replace(/\.[^.]+$/, '');
    try {
      const dataUrl = await fileToDataUrl(file);
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
      const entry = await uploadFont(safe, fam, dataUrl);
      // Refresh server-backed list so we pick up any rewrites.
      const fresh = await listFonts();
      props.setCustomFonts(fresh);
      props.onToast(`Uploaded ${entry.family}`, 'ok');
      setFamily('');
    } catch (err) {
      props.onToast((err as Error).message, 'err');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onRemoveCustom(name: string) {
    try {
      await deleteFont(name);
      const fresh = await listFonts();
      props.setCustomFonts(fresh);
    } catch (err) {
      props.onToast((err as Error).message, 'err');
    }
  }

  function onAddGoogle() {
    const fam = gfInput.trim();
    if (!fam) return;
    if (loadGoogleFont(fam)) props.addGoogleFont(fam);
    setGfInput('');
  }

  return (
    <>
      <div className="style-dock__sub">
        <h5 className="style-dock__sublabel">{ui(lang, 'style.font.custom')}</h5>
        <div className="style-dock__font-upload">
          <input
            className="style-dock__input"
            type="text"
            value={family}
            onChange={e => setFamily(e.target.value)}
            placeholder={ui(lang, 'style.font.custom.family')}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            onChange={onPickFile}
            style={{ display: 'none' }}
          />
          <button
            className="btn--xs"
            type="button"
            onClick={() => fileRef.current?.click()}
          >{ui(lang, 'style.font.custom.upload')}</button>
        </div>
        {props.customFonts.length > 0 && (
          <ul className="style-dock__chiplist">
            {props.customFonts.map(f => (
              <li key={f.name} className="style-dock__chip" title={f.name}>
                <span style={{ fontFamily: `"${f.family}", system-ui` }}>{f.family}</span>
                <button
                  type="button"
                  className="style-dock__chip-x"
                  onClick={() => onRemoveCustom(f.name)}
                  aria-label="Remove"
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="style-dock__sub">
        <h5 className="style-dock__sublabel">{ui(lang, 'style.font.google')}</h5>
        <div className="style-dock__font-upload">
          <input
            className="style-dock__input"
            type="text"
            value={gfInput}
            onChange={e => setGfInput(e.target.value)}
            placeholder={ui(lang, 'style.font.google.placeholder')}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddGoogle(); } }}
          />
          <button className="btn--xs" type="button" onClick={onAddGoogle}>
            {ui(lang, 'style.font.google.add')}
          </button>
        </div>
        {props.googleFonts.length > 0 && (
          <ul className="style-dock__chiplist">
            {props.googleFonts.map(f => (
              <li key={f} className="style-dock__chip">
                <span style={{ fontFamily: `"${f}", system-ui` }}>{f}</span>
                <button
                  type="button"
                  className="style-dock__chip-x"
                  onClick={() => props.removeGoogleFont(f)}
                  aria-label="Remove"
                >×</button>
              </li>
            ))}
          </ul>
        )}
        <p className="style-dock__hint">
          Preloaded baseline: {BASE_FONTS.slice(0, 6).join(', ')}…
        </p>
      </div>
    </>
  );
}
