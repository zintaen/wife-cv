import { useEffect, useRef } from 'react';
import { isReducedMotion } from './prefers';

/**
 * Animated film-grain overlay. Fixed, non-interactive, mix-blend-overlay on
 * the entire viewport. Rendered as a canvas so we can generate new noise each
 * frame (every ~80ms — no need to animate at 60fps). Reduced-motion users get
 * a single static frame.
 *
 * Opacity + blend mode are controlled by CSS so vibes can tweak the feel via
 * `--grain-opacity` / `--grain-blend`.
 */
export function GrainOverlay(props?: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = 180, H = 180;
    canvas.width = W; canvas.height = H;

    const draw = () => {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i]     = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 28;      // alpha — low; the blend mode does the lifting
      }
      ctx.putImageData(img, 0, 0);
    };

    draw();
    if (isReducedMotion()) return;

    let last = 0;
    let raf = 0;
    const FRAME_MS = 80;      // re-generate ~12.5 fps, feels alive but cheap
    const loop = (t: number) => {
      if (t - last > FRAME_MS) { draw(); last = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mx-grain"
      aria-hidden="true"
      style={props?.opacity != null ? { opacity: props.opacity } : undefined}
    />
  );
}
