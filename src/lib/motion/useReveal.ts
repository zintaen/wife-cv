import { useEffect, useRef } from 'react';
import { isReducedMotion } from './prefers';

/**
 * Scroll-reveal hook. Attaches an IntersectionObserver to the returned ref and
 * toggles `data-in` on the element the first time it crosses the threshold,
 * leaving it on after. CSS drives the actual transition (opacity, translate,
 * mask). Reduced-motion users get `data-in="1"` set synchronously so nothing
 * is ever "hidden" waiting on animation.
 *
 * Usage:
 *   const ref = useReveal<HTMLDivElement>({ threshold: 0.15 });
 *   return <div ref={ref} data-reveal>…</div>;
 *
 * CSS:
 *   [data-reveal]           { opacity: 0; transform: translateY(14px); transition: opacity .9s, transform .9s; }
 *   [data-reveal][data-in]  { opacity: 1; transform: none; }
 */
export function useReveal<T extends HTMLElement = HTMLElement>(opts?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  root?: Element | null;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion bypass — show immediately, no observer, no transitions.
    if (isReducedMotion()) {
      el.setAttribute('data-in', '1');
      return;
    }

    const once      = opts?.once ?? true;
    const threshold = opts?.threshold ?? 0.12;
    const rootMargin = opts?.rootMargin ?? '0px 0px -10% 0px';

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.setAttribute('data-in', '1');
          if (once) io.unobserve(el);
        } else if (!once) {
          el.removeAttribute('data-in');
        }
      }
    }, { threshold, rootMargin, root: opts?.root ?? null });

    io.observe(el);
    return () => io.disconnect();
  }, [opts?.threshold, opts?.rootMargin, opts?.once, opts?.root]);

  return ref;
}

/**
 * Stagger-reveal helper: reveals children one-at-a-time by adding a
 * `--reveal-index` custom property, so CSS can use `transition-delay:
 * calc(var(--reveal-index) * .05s)`. Child elements should have `data-reveal`
 * so the delay applies. Call on a parent ref.
 */
export function useStaggeredReveal<T extends HTMLElement = HTMLElement>(opts?: {
  selector?: string;
  delayStep?: number;      // seconds per index
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sel = opts?.selector ?? '[data-reveal]';
    const step = opts?.delayStep ?? 0.05;
    const kids = Array.from(el.querySelectorAll<HTMLElement>(sel));
    kids.forEach((k, i) => { k.style.setProperty('--reveal-index', String(i)); k.style.setProperty('--reveal-delay', `${i * step}s`); });

    if (isReducedMotion()) {
      kids.forEach(k => k.setAttribute('data-in', '1'));
      return;
    }

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          kids.forEach(k => k.setAttribute('data-in', '1'));
          io.disconnect();
          break;
        }
      }
    }, {
      threshold: opts?.threshold ?? 0.1,
      rootMargin: opts?.rootMargin ?? '0px 0px -8% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [opts?.selector, opts?.delayStep, opts?.threshold, opts?.rootMargin]);

  return ref;
}
