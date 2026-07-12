// ============================================================================
// Smooth-scroll hijack — Locomotive-style eased scroll on desktop only.
//
// How it works: we don't virtualize the layout; we let the browser scroll
// normally but intercept wheel + keyboard + anchor events, accumulate a target
// offset, and ease the actual scrollTop toward it each rAF. This preserves
// native features (anchor jumps, keyboard nav, a11y focus-scroll) because the
// *real* scroll position is always the current eased value.
//
// Why not CSS `scroll-behavior: smooth`? Because it only smooths programmatic
// scrolls, not wheel gestures, and has no damping control. This gives the
// signature "heavy" inertial feel without jank.
//
// Where it runs: attached to a single scroll container (the preview pane or
// the document). Desktop + hover-pointer + no reduced-motion only. Otherwise
// it's a no-op.
// ============================================================================

import { allowsDesktopFx } from './prefers';

export interface SmoothScrollOptions {
  /** Lerp factor per frame. 0.08 = slow + silky, 0.16 = responsive, 0.22 = snappier. */
  ease?: number;
  /** Wheel multiplier — how far one wheel tick moves the target. Default 1. */
  multiplier?: number;
  /** Max delta per wheel event, prevents huge jumps on precision trackpads. */
  maxDelta?: number;
}

export interface SmoothScrollHandle {
  destroy(): void;
  scrollTo(y: number, opts?: { immediate?: boolean }): void;
  /** Current eased scroll position (for parallax consumers). */
  current(): number;
}

export function attachSmoothScroll(
  scroller: HTMLElement | Window | Document,
  opts: SmoothScrollOptions = {},
): SmoothScrollHandle {
  if (!allowsDesktopFx()) {
    return { destroy: () => {}, scrollTo: () => {}, current: () => 0 };
  }

  const el = (scroller === window || scroller === document)
    ? document.scrollingElement as HTMLElement
    : scroller as HTMLElement;

  const ease       = opts.ease       ?? 0.1;
  const multiplier = opts.multiplier ?? 1;
  const maxDelta   = opts.maxDelta   ?? 180;

  let target  = el.scrollTop;
  let current = el.scrollTop;
  let raf = 0;
  let hijacking = true;

  const clampTarget = () => {
    const max = el.scrollHeight - el.clientHeight;
    if (target < 0) target = 0;
    if (target > max) target = max;
  };

  const tick = () => {
    current += (target - current) * ease;
    // Snap to target when we're very close — avoids long tail of micro-updates.
    if (Math.abs(target - current) < 0.3) current = target;
    el.scrollTop = current;
    // Broadcast for parallax consumers that want to read the eased value.
    el.dispatchEvent(new CustomEvent('smoothscroll', { detail: { y: current } }));
    if (current !== target) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // Intercept wheel so we can damp the delta. Touch + pointer are left alone
  // (the browser handles touchpad inertia natively and wheel-events on touch
  // devices are rare / weird).
  const onWheel = (ev: WheelEvent) => {
    if (!hijacking) return;
    if (ev.ctrlKey) return;  // zoom gesture — let the browser have it
    let d = ev.deltaY;
    if (ev.deltaMode === 1) d *= 16;        // lines → px
    else if (ev.deltaMode === 2) d *= el.clientHeight; // pages → px
    if (Math.abs(d) > maxDelta) d = Math.sign(d) * maxDelta;
    target += d * multiplier;
    clampTarget();
    ev.preventDefault();
    kick();
  };

  // Keep target in sync when the user drags the scrollbar, uses keyboard
  // PageUp/PageDown, or the OS forces a scroll (e.g. focus-ring jump).
  const onScrollExternal = () => {
    // Only re-sync when we're NOT actively easing to a target we set — otherwise
    // wheel updates fight with the browser's own scrollTop write.
    if (!raf) {
      current = target = el.scrollTop;
    }
  };

  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('scroll', onScrollExternal, { passive: true });

  return {
    destroy() {
      hijacking = false;
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScrollExternal);
      if (raf) cancelAnimationFrame(raf);
    },
    scrollTo(y: number, o?: { immediate?: boolean }) {
      target = y;
      clampTarget();
      if (o?.immediate) {
        current = target;
        el.scrollTop = current;
      } else {
        kick();
      }
    },
    current() { return current; },
  };
}

// ----------------------------------------------------------------------------
// Small helpers that read the eased scroll position for parallax bindings.
// Elements opt in by setting `data-parallax="<speed>"` and optionally
// `data-parallax-axis="y|x"`; the binder walks the subtree each frame.
// ----------------------------------------------------------------------------
export function attachParallax(scroller: HTMLElement, root: HTMLElement = scroller) {
  if (!allowsDesktopFx()) return () => {};

  let raf = 0;
  const nodes = (): NodeListOf<HTMLElement> => root.querySelectorAll<HTMLElement>('[data-parallax]');

  const apply = (y: number) => {
    nodes().forEach(n => {
      const speed = parseFloat(n.dataset.parallax || '0.2');
      const axis = n.dataset.parallaxAxis === 'x' ? 'x' : 'y';
      // compute offset relative to element's own top in the scroller
      const rect = n.getBoundingClientRect();
      const scrRect = scroller.getBoundingClientRect();
      const relTop = rect.top - scrRect.top;
      // only animate when near the viewport — saves transforms on off-screen nodes
      if (relTop > scroller.clientHeight + 200 || relTop < -rect.height - 200) return;
      const offset = (relTop - scroller.clientHeight / 2) * speed;
      n.style.transform = axis === 'x'
        ? `translate3d(${offset.toFixed(2)}px, 0, 0)`
        : `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
    void y;
  };

  const onSmooth = (e: Event) => {
    const y = (e as CustomEvent<{ y: number }>).detail?.y ?? scroller.scrollTop;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply(y); });
  };
  scroller.addEventListener('smoothscroll', onSmooth);
  // First paint
  apply(scroller.scrollTop);

  return () => {
    scroller.removeEventListener('smoothscroll', onSmooth);
    if (raf) cancelAnimationFrame(raf);
  };
}
