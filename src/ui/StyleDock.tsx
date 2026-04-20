import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { VIBES, VIBE_ORDER } from '@/vibes';
import type { VibeKey } from '@/types/content';

// A slide-over panel docked on the right of the preview. Vibe chips +
// (future) per-vibe color + typography overrides. Overrides already round-trip
// via store.setVibeOverride / resetVibeOverrides; the UI surfaces only the
// vibe picker for now — color/font fine-tuning is a follow-up.
export function StyleDock({ onClose }: { onClose: () => void }) {
  const lang = useStore(s => s.lang);
  const vibe = useStore(s => s.vibe);
  const setVibe = useStore(s => s.setVibe);

  return (
    <aside
      aria-label="Vibe & Typography"
      style={{
        position: 'fixed', top: 48, right: 0, bottom: 0, width: 340,
        background: 'var(--chrome-bg)', color: 'var(--chrome-fg)',
        borderLeft: '1px solid var(--chrome-rule)',
        zIndex: 100, overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div className="sidebar__head">
        <h3>{ui(lang, 'style.title')}</h3>
        <button className="btn--xs" onClick={onClose}>{ui(lang, 'style.close')}</button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section>
          <h4 style={{
            margin: '0 0 10px', fontSize: 11, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--chrome-muted)',
          }}>{ui(lang, 'style.section.preset')}</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {VIBE_ORDER.map((k: VibeKey) => {
              const v = VIBES[k];
              const active = vibe === k;
              return (
                <button
                  key={k}
                  onClick={() => setVibe(k)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 8, background: active ? 'var(--chrome-hover)' : 'transparent',
                    border: '1px solid ' + (active ? 'var(--chrome-fg)' : 'var(--chrome-rule)'),
                    color: 'var(--chrome-fg)', cursor: 'pointer', textAlign: 'left', font: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
                    <strong style={{ fontSize: 12 }}>{v.label}</strong>
                    <span style={{ fontSize: 10, color: 'var(--chrome-muted)', letterSpacing: '.04em' }}>
                      {v.suited}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {v.swatch.slice(0, 6).map((c, i) => (
                      <span key={i} style={{
                        width: 12, height: 18, background: c,
                        border: '1px solid var(--chrome-rule)',
                      }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h4 style={{
            margin: '0 0 10px', fontSize: 11, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--chrome-muted)',
          }}>{ui(lang, 'style.section.colors')}</h4>
          <p style={{ fontSize: 11, color: 'var(--chrome-muted)', margin: 0 }}>
            Per-vibe color overrides — coming in the next iteration. For now, each vibe ships a
            curated palette keyed to its moodboard entry.
          </p>
        </section>
      </div>
    </aside>
  );
}
