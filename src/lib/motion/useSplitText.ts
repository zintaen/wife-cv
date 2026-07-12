import { useEffect, useRef } from 'react';
import { isReducedMotion } from './prefers';

/**
 * Split the text content of an element into per-word (and optionally per-char)
 * spans so CSS can animate them individually. Each span gets:
 *   - `.sp-word` / `.sp-char`
 *   - CSS var `--i` (index)
 *   - CSS var `--n` (total)
 *   - `data-reveal-text` attribute (parent) — hook for reveal CSS
 *
 * Pair with IntersectionObserver/useReveal on the same ref so the reveal
 * transitions can run once the parent enters the viewport. Reduced-motion:
 * spans are still created (so the text is styleable), but `data-in` is set
 * immediately and no transition runs.
 *
 * The ORIGINAL innerText is snapshotted and restored on unmount / re-split.
 */
export function useSplitText<T extends HTMLElement = HTMLElement>(opts?: {
  byChar?: boolean;
  observe?: boolean;      // attach IntersectionObserver for data-in reveal (default true)
  threshold?: number;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const text = el.textContent ?? '';
    // Snapshot for cleanup so repeated renders don't corrupt the DOM.
    const original = text;
    el.setAttribute('data-reveal-text', '');

    const words = text.split(/(\s+)/);   // keep whitespace tokens so copy still round-trips
    // Build a fresh DOM fragment.
    el.textContent = '';
    let idx = 0;
    let total = 0;
    const spans: HTMLElement[] = [];

    for (const token of words) {
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
        continue;
      }
      if (!token.length) continue;
      const word = document.createElement('span');
      word.className = 'sp-word';
      if (opts?.byChar) {
        const chars = Array.from(token);
        for (const ch of chars) {
          const c = document.createElement('span');
          c.className = 'sp-char';
          c.style.setProperty('--i', String(idx++));
          c.textContent = ch;
          word.appendChild(c);
          spans.push(c);
          total++;
        }
      } else {
        word.style.setProperty('--i', String(idx++));
        word.textContent = token;
        spans.push(word);
        total++;
      }
      el.appendChild(word);
    }
    spans.forEach(s => s.style.setProperty('--n', String(total)));
    el.style.setProperty('--n', String(total));

    if (isReducedMotion()) {
      el.setAttribute('data-in', '1');
      return () => { el.textContent = original; el.removeAttribute('data-in'); el.removeAttribute('data-reveal-text'); };
    }

    if (opts?.observe === false) {
      return () => { el.textContent = original; el.removeAttribute('data-in'); el.removeAttribute('data-reveal-text'); };
    }

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.setAttribute('data-in', '1');
          io.disconnect();
          break;
        }
      }
    }, { threshold: opts?.threshold ?? 0.2 });
    io.observe(el);

    return () => {
      io.disconnect();
      el.textContent = original;
      el.removeAttribute('data-in');
      el.removeAttribute('data-reveal-text');
    };
    // intentionally not depending on opts changes at runtime — split on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
