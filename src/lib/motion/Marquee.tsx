import type { ReactNode } from 'react';

/**
 * Infinite, pause-on-hover marquee. Renders its children twice so the
 * animation can translate -50% without a seam. Pure CSS — no JS tick.
 * Speed is controlled via `--marquee-duration` (time to cross one copy).
 *
 * Use for editorial accents — filmography ticker, credits band between
 * sections. Respect reduced-motion: the CSS keyframes shut off under
 * prefers-reduced-motion so the band becomes static.
 */
export function Marquee(props: {
  children: ReactNode;
  duration?: number;      // seconds
  reverse?: boolean;
  gap?: string;           // CSS length between items inside one copy
  className?: string;
}) {
  const style: React.CSSProperties & Record<string, string | number | undefined> = {
    ['--marquee-duration' as string]: `${props.duration ?? 42}s`,
    ['--marquee-gap' as string]:      props.gap ?? '6rem',
  };
  return (
    <div
      className={'mx-marquee' + (props.reverse ? ' is-reverse' : '') + (props.className ? ' ' + props.className : '')}
      style={style}
      aria-hidden="true"
    >
      <div className="mx-marquee__track">
        <div className="mx-marquee__group">{props.children}</div>
        <div className="mx-marquee__group" aria-hidden="true">{props.children}</div>
      </div>
    </div>
  );
}
