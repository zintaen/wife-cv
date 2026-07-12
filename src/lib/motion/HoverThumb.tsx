import { useEffect, useRef, useState, type ReactNode } from 'react';
import { allowsDesktopFx, isTouch } from './prefers';

/**
 * Editorial "hover-reveal thumbnail" — the classic filmography interaction.
 * Wrap a list where each item has `data-thumb="/path/to/image.jpg"`. On
 * pointerenter (desktop) the HoverThumb shows an image that tracks the cursor
 * with rAF easing. On touch devices, tapping an item toggles a centered
 * preview and a second tap or outside-tap dismisses.
 *
 * The wrapped list owns its own layout — HoverThumb is a decoration layer.
 */
export function HoverThumb(props: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef  = useRef<HTMLDivElement>(null);
  const rafRef  = useRef(0);
  const [pinned, setPinned] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const img  = imgRef.current;
    if (!root || !img) return;

    const touch = isTouch();
    const desktop = allowsDesktopFx();

    let mx = 0, my = 0;
    let cx = 0, cy = 0;
    let activeUrl = '';

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      img.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`;
      if (Math.abs(mx - cx) > 0.2 || Math.abs(my - cy) > 0.2) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = 0;
      }
    };
    const kick = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); };

    const setImg = (url: string | null) => {
      if (url === activeUrl) return;
      activeUrl = url || '';
      if (url) {
        img.style.backgroundImage = `url("${url}")`;
        img.dataset.show = '1';
      } else {
        img.dataset.show = '';
      }
    };

    const resolveItem = (el: EventTarget | null): HTMLElement | null => {
      let n: HTMLElement | null = el instanceof HTMLElement ? el : null;
      while (n && n !== root) {
        if (n.dataset && n.dataset.thumb) return n;
        n = n.parentElement;
      }
      return null;
    };

    const onEnter = (e: PointerEvent) => {
      if (!desktop) return;
      const item = resolveItem(e.target);
      if (!item) return;
      setImg(item.dataset.thumb || null);
    };
    const onMove = (e: PointerEvent) => {
      if (!desktop) return;
      mx = e.clientX; my = e.clientY;
      kick();
    };
    const onLeave = () => { if (!desktop) return; setImg(null); };
    const onClick = (e: MouseEvent) => {
      if (!touch) return;
      const item = resolveItem(e.target);
      if (!item) { setPinned(null); return; }
      e.preventDefault();
      const url = item.dataset.thumb || '';
      setPinned(prev => prev === url ? null : url);
    };

    if (desktop) {
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointerover',  onEnter);
      root.addEventListener('pointermove',  onMove);
      root.addEventListener('pointerleave', onLeave);
    }
    if (touch) {
      root.addEventListener('click', onClick);
    }

    return () => {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerover',  onEnter);
      root.removeEventListener('pointermove',  onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('click', onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className={'mx-hoverthumb' + (props.className ? ' ' + props.className : '')}>
      {props.children}
      <div
        ref={imgRef}
        className="mx-hoverthumb__preview"
        aria-hidden="true"
      />
      {pinned ? (
        <div
          className="mx-hoverthumb__pinned"
          role="dialog"
          aria-modal="true"
          onClick={() => setPinned(null)}
        >
          <div
            className="mx-hoverthumb__pinned-img"
            style={{ backgroundImage: `url("${pinned}")` }}
          />
        </div>
      ) : null}
    </div>
  );
}
