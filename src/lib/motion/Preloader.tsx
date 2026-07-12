import { useEffect, useRef, useState } from 'react';

/**
 * Cinematic preloader — counts 0 → 100 while real assets (fonts + images on
 * the current page) load, then runs a curtain-reveal exit. The counter eases
 * toward the true load fraction so it never jumps or finishes early when we
 * have no images to wait on. Skippable via click/tap/Escape.
 *
 * Appears once per session (tracked in sessionStorage) — so a visitor who
 * bounces and returns isn't re-nagged. Pass `force` to override.
 */
export function Preloader(props?: { label?: string; force?: boolean; sessionKey?: string }) {
  const key = props?.sessionKey ?? 'portfolio.preloader.seen';
  const [shown, setShown] = useState(() => {
    if (props?.force) return true;
    if (typeof sessionStorage === 'undefined') return true;
    try { return !sessionStorage.getItem(key); } catch { return true; }
  });
  const [value, setValue] = useState(0);
  const [hiding, setHiding] = useState(false);
  const rafRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!shown) return;
    document.body.classList.add('is-preloading');
    return () => document.body.classList.remove('is-preloading');
  }, [shown]);

  useEffect(() => {
    if (!shown) return;

    let target = 0;
    let current = 0;

    const computeFraction = () => {
      const imgs = Array.from(document.images ?? []);
      // Fonts API fraction (0..1)
      let fontFrac = 1;
      try { fontFrac = document.fonts?.status === 'loaded' ? 1 : 0.4; } catch {/* no-op */}
      if (!imgs.length) return Math.max(fontFrac, 0.6);
      const done = imgs.filter(i => i.complete).length;
      return (done / imgs.length) * 0.85 + fontFrac * 0.15;
    };

    const tick = () => {
      target = Math.min(1, computeFraction());
      current += (target - current) * 0.08;
      const v = Math.min(1, current + 0.002);
      setValue(Math.round(v * 100));
      if (v >= 0.999 && target >= 0.999) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          setTimeout(finish, 280);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    // Kick off: wait for fonts if possible
    (async () => {
      try { await document.fonts?.ready; } catch {/* no-op */}
      rafRef.current = requestAnimationFrame(tick);
    })();

    const finish = () => {
      setHiding(true);
      try { sessionStorage.setItem(key, '1'); } catch {/* quota */}
      setTimeout(() => setShown(false), 1100);   // match CSS exit transition
    };

    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (!finishedRef.current) {
        finishedRef.current = true;
        target = 1; current = 1; setValue(100);
        finish();
      }
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('click', skip);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
  }, [shown, key]);

  if (!shown) return null;
  return (
    <div className={'mx-preloader' + (hiding ? ' is-hiding' : '')} role="status" aria-live="polite" aria-label="Loading">
      <div className="mx-preloader__curtain" />
      <div className="mx-preloader__counter" aria-hidden="false">
        <span className="mx-preloader__num">{String(value).padStart(3, '0')}</span>
        <span className="mx-preloader__pct">%</span>
      </div>
      <div className="mx-preloader__label">{props?.label ?? 'Lâm Thanh Tiệp — Portfolio'}</div>
      <div className="mx-preloader__bar"><span style={{ transform: `scaleX(${value / 100})` }} /></div>
    </div>
  );
}
