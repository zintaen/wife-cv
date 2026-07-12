import { useEffect, useRef, useLayoutEffect, type ReactNode } from 'react';
import { isReducedMotion, isTouch } from './prefers';

/**
 * Pinned horizontal scroll rail — a signature Locomotive move. The wrapper
 * becomes tall (so the page scrolls "through" it) while a sticky inner
 * translates its children horizontally, tied to the wrapper's scroll-progress.
 *
 * Desktop (hover pointer, no reduced-motion): full pinned-scroll behavior.
 * Touch: falls back to native horizontal overflow scroll — users can swipe
 * through the rail naturally. Reduced-motion: same native-scroll fallback.
 *
 * The children should be a flex row; this component does NOT dictate their
 * layout beyond setting `--rail-width` (computed from scrollWidth) so CSS can
 * size the outer wrapper correctly.
 */
export function HorizontalRail(props: {
  children: ReactNode;
  className?: string;
  /** Height-to-width ratio for the outer wrapper. 1 = wrapper-height == content-width. */
  ratio?: number;
}) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Compute the extra height we need so the horizontal distance == scroll distance.
  useLayoutEffect(() => {
    const wrap  = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    const compute = () => {
      const viewport = window.innerHeight;
      const trackW   = track.scrollWidth;
      const extra    = Math.max(0, trackW - window.innerWidth);
      const ratio    = props.ratio ?? 1;
      wrap.style.setProperty('--rail-extra', `${extra * ratio}px`);
      wrap.style.setProperty('--rail-viewport', `${viewport}px`);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(track);
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, [props.ratio]);

  useEffect(() => {
    const wrap  = wrapRef.current;
    const stick = stickRef.current;
    const track = trackRef.current;
    if (!wrap || !stick || !track) return;

    // Touch or reduced-motion → enable native horizontal overflow fallback.
    if (isTouch() || isReducedMotion()) {
      wrap.dataset.mode = 'native';
      return;
    }
    wrap.dataset.mode = 'pinned';

    // Find the scroll container — prefer the preview pane, fall back to window.
    const findScroller = (): HTMLElement | null => {
      let node: HTMLElement | null = wrap.parentElement;
      while (node) {
        const style = getComputedStyle(node);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return document.scrollingElement as HTMLElement | null;
    };

    const scroller = findScroller() ?? (document.scrollingElement as HTMLElement);
    if (!scroller) return;

    let raf = 0;
    const apply = () => {
      const wrapRect  = wrap.getBoundingClientRect();
      const scrRect   = scroller.getBoundingClientRect();
      const relTop    = wrapRect.top - scrRect.top;
      const total     = wrap.offsetHeight - window.innerHeight;
      const progress  = Math.max(0, Math.min(1, -relTop / Math.max(1, total)));
      const trackW    = track.scrollWidth;
      const extra     = Math.max(0, trackW - window.innerWidth);
      track.style.transform = `translate3d(${(-progress * extra).toFixed(2)}px, 0, 0)`;
      raf = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(apply); };

    scroller.addEventListener('scroll', kick, { passive: true });
    scroller.addEventListener('smoothscroll', kick, { passive: true } as AddEventListenerOptions);
    window.addEventListener('resize', kick);
    apply();
    return () => {
      scroller.removeEventListener('scroll', kick);
      scroller.removeEventListener('smoothscroll', kick as EventListener);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={'mx-rail' + (props.className ? ' ' + props.className : '')}
    >
      <div ref={stickRef} className="mx-rail__stick">
        <div ref={trackRef} className="mx-rail__track">
          {props.children}
        </div>
      </div>
    </div>
  );
}
