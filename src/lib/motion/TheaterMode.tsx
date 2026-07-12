import { useEffect, useState, type ReactNode } from 'react';

/**
 * Theater mode — tap/click any media frame with `data-theater-src="…"` inside
 * the wrapped subtree, and it expands into a full-viewport overlay with curtains
 * easing in. Click the backdrop, press Escape, or tap the close button to
 * dismiss. Pure DOM-delegated, so dozens of frames don't each register their
 * own listener.
 *
 * Keyboard: Escape to close. Arrow left/right to step through sibling frames
 * in the same subtree (ordered by DOM appearance).
 */
export function TheaterMode(props: { children: ReactNode; className?: string }) {
  const [index, setIndex] = useState<number>(-1);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const node = (e.target as HTMLElement | null)?.closest?.('[data-theater-src]') as HTMLElement | null;
      if (!node) return;
      e.preventDefault();
      const scope = node.closest('.mx-theater-scope') as HTMLElement | null;
      if (!scope) return;
      const all = Array.from(scope.querySelectorAll<HTMLElement>('[data-theater-src]'));
      const urls = all.map(n => n.dataset.theaterSrc ?? '').filter(Boolean);
      const idx = all.indexOf(node);
      setItems(urls);
      setIndex(Math.max(0, idx));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (index < 0) return;
    document.body.classList.add('is-theater');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(-1);
      else if (e.key === 'ArrowRight') setIndex(i => (i + 1) % items.length);
      else if (e.key === 'ArrowLeft')  setIndex(i => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('is-theater');
      window.removeEventListener('keydown', onKey);
    };
  }, [index, items.length]);

  return (
    <div className={'mx-theater-scope' + (props.className ? ' ' + props.className : '')}>
      {props.children}
      {index >= 0 ? (
        <div
          className="mx-theater"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('mx-theater') ||
                (e.target as HTMLElement).classList.contains('mx-theater__curtain')) {
              setIndex(-1);
            }
          }}
        >
          <div className="mx-theater__curtain mx-theater__curtain--top" />
          <div className="mx-theater__curtain mx-theater__curtain--bot" />
          <div className="mx-theater__stage">
            <img
              className="mx-theater__img"
              src={items[index]}
              alt=""
            />
          </div>
          <button
            type="button"
            className="mx-theater__close"
            aria-label="Close"
            onClick={() => setIndex(-1)}
          >
            <span>ESC</span>
          </button>
          {items.length > 1 ? (
            <div className="mx-theater__nav" aria-hidden="false">
              <button
                type="button"
                className="mx-theater__nav-btn"
                onClick={() => setIndex(i => (i - 1 + items.length) % items.length)}
                aria-label="Previous"
              >←</button>
              <div className="mx-theater__nav-count">
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </div>
              <button
                type="button"
                className="mx-theater__nav-btn"
                onClick={() => setIndex(i => (i + 1) % items.length)}
                aria-label="Next"
              >→</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
