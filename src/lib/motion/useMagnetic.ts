import { useEffect, useRef } from 'react';
import { allowsDesktopFx } from './prefers';

/**
 * Magnetic pull — when the cursor enters an element's "influence zone" (slightly
 * larger than its bounding box), the element translates a fraction of the way
 * toward the cursor with rAF easing. On leave, it eases back to origin.
 * Desktop-only. Touch and reduced-motion users get no-op.
 *
 * Inspired by Benoist's magnetic buttons and Locomotive's hover states.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(opts?: {
  strength?: number;   // 0..1, how far to pull (0.35 ≈ classic feel)
  radius?: number;     // px added to bounding box for the hot zone
  ease?: number;       // 0..1, lerp factor per frame (0.18 smooth)
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!allowsDesktopFx()) return;

    const strength = opts?.strength ?? 0.35;
    const radius   = opts?.radius   ?? 40;
    const ease     = opts?.ease     ?? 0.18;

    let raf = 0;
    let tx = 0, ty = 0;      // target
    let cx = 0, cy = 0;      // current (eased)
    let active = false;

    const loop = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || active) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
        el.style.transform = '';
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left - radius && e.clientX <= rect.right + radius &&
        e.clientY >= rect.top  - radius && e.clientY <= rect.bottom + radius;
      if (inside) {
        active = true;
        const cx0 = rect.left + rect.width  / 2;
        const cy0 = rect.top  + rect.height / 2;
        tx = (e.clientX - cx0) * strength;
        ty = (e.clientY - cy0) * strength;
        kick();
      } else if (active) {
        active = false;
        tx = 0; ty = 0;
        kick();
      }
    };

    const onLeave = () => { active = false; tx = 0; ty = 0; kick(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [opts?.strength, opts?.radius, opts?.ease]);

  return ref;
}
