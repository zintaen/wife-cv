import { useEffect, useRef, useState } from 'react';
import { allowsDesktopFx } from './prefers';

/**
 * Custom cursor — a blended-difference dot + soft ring pair that trails the
 * pointer with rAF easing. Components opt into hover states by setting
 * `data-cursor="view"|"drag"|"play"|"zoom"|"hide"|"link"` on themselves, or a
 * caption via `data-cursor-label="Watch reel"`. The cursor component listens
 * at `document` and walks up from `event.target` on every pointermove.
 *
 * Mounts a fixed-position overlay; only activates on hover-pointer devices
 * with no reduced-motion preference. Renders nothing on touch / reduced-motion.
 */
export function Cursor() {
  const [mounted, setMounted] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allowsDesktopFx()) return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const ring = ringRef.current;
    const dot  = dotRef.current;
    const lab  = labelRef.current;
    if (!ring || !dot || !lab) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;         // ring (lags)
    let dx = mx, dy = my;         // dot (tight)
    let raf = 0;
    let cursorState = '';
    let cursorLabel = '';

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dx += (mx - dx) * 0.5;
      dy += (my - dy) * 0.5;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) translate(-50%, -50%)`;
      dot.style.transform  = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const updateContext = (el: Element | null) => {
      let state = '';
      let label = '';
      let node: Element | null = el;
      while (node && node !== document.body) {
        const dc = (node as HTMLElement).dataset?.cursor;
        const dl = (node as HTMLElement).dataset?.cursorLabel;
        if (!state && dc)  state = dc;
        if (!label && dl)  label = dl;
        if (state && label) break;
        node = node.parentElement;
      }
      // Auto-link detection — <a> or <button> gets the "link" state if nothing set.
      if (!state && el) {
        const h = (el as Element).closest?.('a, button, [role="button"]');
        if (h) state = 'link';
      }
      if (state !== cursorState) {
        cursorState = state;
        ring.dataset.state = state || '';
        dot.dataset.state  = state || '';
      }
      if (label !== cursorLabel) {
        cursorLabel = label;
        lab.textContent = label;
        lab.dataset.show = label ? '1' : '';
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      updateContext(e.target as Element);
      document.body.classList.add('has-cursor');
    };
    const onLeave = () => { document.body.classList.remove('has-cursor'); };
    const onDown  = () => { ring.dataset.pressed = '1'; };
    const onUp    = () => { ring.dataset.pressed = ''; };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup',   onUp,   { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup',   onUp);
      document.body.classList.remove('has-cursor');
    };
  }, [mounted]);

  if (!mounted) return null;
  return (
    <>
      <div ref={ringRef} className="mx-cursor mx-cursor--ring" aria-hidden="true" />
      <div ref={dotRef}  className="mx-cursor mx-cursor--dot"  aria-hidden="true" />
      <div ref={labelRef} className="mx-cursor-label" aria-hidden="true" />
    </>
  );
}
