import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { VIBES, VIBE_ORDER } from '@/vibes';
import type { VibeKey } from '@/types/content';

// Right-docked style panel. It lives as the 4th grid column of the shell
// (see base.css `.style-dock { grid-area: dock }` + `body.is-dock-open`).
// Vibe chips + (future) per-vibe color + typography overrides. Overrides
// already round-trip via store.setVibeOverride / resetVibeOverrides; the UI
// surfaces only the vibe picker for now — color/font fine-tuning is a
// follow-up.
export function StyleDock({ onClose }: { onClose: () => void }) {
  const lang = useStore(s => s.lang);
  const vibe = useStore(s => s.vibe);
  const setVibe = useStore(s => s.setVibe);

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
