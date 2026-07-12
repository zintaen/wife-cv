import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { VIBES, VIBE_ORDER } from '@/vibes';
import type { VibeKey } from '@/types/content';
import {
  FONT_VARS, BASE_FONTS, allKnownFontFamilies,
  buildFontStack, loadGoogleFont, injectCustomFontFaces, fileToDataUrl,
} from '@/lib/fonts';
import { listFonts, uploadFont, deleteFont } from '@/lib/api';

// -----------------------------------------------------------------------------
// StyleDock — vibe & typography controls.
// Visual spine: editorial masthead, animated vibe chips (selected chip has a
// gold layoutId bar that slides between rows), tactile font dropdowns, and a
// font-sources block (upload + Google Fonts).
// -----------------------------------------------------------------------------
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
  const reduced       = useReducedMotion();

  const activeOverrides = overrides[vibe] ?? {};
  const families = allKnownFontFamilies(customFonts, googleFonts);

  function familyFromStack(stack: string | undefined): string {
    if (!stack) return '';
    const m = stack.trim().match(/^"([^"]+)"|^([A-Za-z0-9\- ]+)/);
    return (m?.[1] ?? m?.[2] ?? '').trim();
  }

  return (
    <motion.aside
      className="style-dock"
      aria-label="Vibe & Typography"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="style-dock__head">
        <div className="sidebar__head-eyebrow">
          <span className="sidebar__head-num">03 /</span>
          <span className="sidebar__head-label">{ui(lang, 'style.title')}</span>
        </div>
        <h3 className="sidebar__head-title">{ui(lang, 'style.title')}</h3>
        <motion.button
          className="btn--xs"
          onClick={onClose}
          whileTap={{ scale: 0.94 }}
        >
          {ui(lang, 'style.close')}
        </motion.button>
      </div>

      <div className="style-dock__body">
        <section className="style-dock__section">
          <h4 className="style-dock__label">{ui(lang, 'style.section.preset')}</h4>

          <div className="style-dock__vibes">
            {VIBE_ORDER.map((k: VibeKey) => {
              const v = VIBES[k];
              const active = vibe === k;
              return (
                <motion.button
                  key={k}
                  onClick={() => setVibe(k)}
                  className={'vibe-chip ' + (active ? 'is-active' : '')}
                  whileHover={reduced ? undefined : { y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                >
                  {active ? (
                    <motion.span
                      layoutId="vibe-chip-active-bar"
                      className="vibe-chip__active-bar"
                      aria-hidden
                      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                    />
                  ) : null}
                  <div className="vibe-chip__text">
                    <strong>{v.label}</strong>
                    <span>{v.suited}</span>
                  </div>
                  <div className="vibe-chip__swatches">
                    {v.swatch.slice(0, 6).map((c, i) => (
                      <motion.span
                        key={i}
                        style={{ background: c }}
                        initial={false}
                        animate={{ opacity: active ? 1 : 0.88 }}
                      />
                    ))}
                  </div>
                </motion.button>
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
    </motion.aside>
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

  useEffect(() => { injectCustomFontFaces(props.customFonts); }, [props.customFonts]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fam = family.trim() || file.name.replace(/\.[^.]+$/, '');
    try {
      const dataUrl = await fileToDataUrl(file);
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
      const entry = await uploadFont(safe, fam, dataUrl);
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
