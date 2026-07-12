import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// -----------------------------------------------------------------------------
// Vertical drag handle that resizes the left/right split in .shell.
//
// ▸ Pointer-capture drag (glued to handle even when cursor outruns it)
// ▸ Snap zones: <8% → 0 (collapse left), >92% → 100 (collapse right)
// ▸ Detent at 40% — soft snap as you pass it, cued by a tiny flash
// ▸ Framer-motion spring grip that grows on hover/drag
// ▸ Double-click resets to defaultPct
// ▸ Keyboard support: ← → move in 2% steps, ⇧ in 10%, Home/End snap
// -----------------------------------------------------------------------------
export function Splitter({
  leftPct, setLeftPct, defaultPct = 40,
}: {
  leftPct: number;
  setLeftPct: (n: number) => void;
  defaultPct?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [hit, setHit] = useState<'detent' | 'edge' | null>(null);
  const reduced = useReducedMotion();

  // Debounce the detent/edge flashes so they feel like a haptic click.
  const flashTimer = useRef<number | null>(null);
  const flash = (kind: 'detent' | 'edge') => {
    setHit(kind);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setHit(null), 220);
  };

  // Commits a new value, applying snap and detent rules. `prev` is used to
  // detect whether we CROSSED the detent so we only flash once per pass.
  const commit = (raw: number, prev: number) => {
    let next: number;
    if (raw < 8) { next = 0; if (prev > 8) flash('edge'); }
    else if (raw > 92) { next = 100; if (prev < 92) flash('edge'); }
    else {
      next = Math.max(15, Math.min(85, raw));
      // Soft detent at defaultPct: if we're within 1.5% and the last
      // value wasn't in that band, snap + flash. Lets users feel the
      // "home" position without locking them there.
      if (Math.abs(next - defaultPct) < 1.5 && Math.abs(prev - defaultPct) >= 1.5) {
        next = defaultPct;
        flash('detent');
      }
    }
    setLeftPct(next);
  };

  return (
    <div
      className={
        'splitter'
        + (dragging ? ' is-dragging' : '')
        + (hit === 'detent' ? ' is-detent' : '')
        + (hit === 'edge' ? ' is-edge' : '')
      }
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(leftPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      title="Drag to resize · Drag to edge to collapse · Double-click to reset · ←/→ keys"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
        document.body.classList.add('is-resizing');
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const shell = (e.currentTarget as HTMLElement).parentElement;
        if (!shell) return;
        const rect = shell.getBoundingClientRect();
        const raw = ((e.clientX - rect.left) / rect.width) * 100;
        commit(raw, leftPct);
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setDragging(false);
        document.body.classList.remove('is-resizing');
      }}
      onDoubleClick={() => { setLeftPct(defaultPct); flash('detent'); }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); commit(leftPct - step, leftPct); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); commit(leftPct + step, leftPct); }
        else if (e.key === 'Home') { e.preventDefault(); setLeftPct(0); flash('edge'); }
        else if (e.key === 'End')  { e.preventDefault(); setLeftPct(100); flash('edge'); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLeftPct(defaultPct); flash('detent'); }
      }}
    >
      <motion.div
        className="splitter__grip"
        aria-hidden
        animate={{
          scaleY: dragging ? 1.25 : 1,
          scaleX: dragging ? 1.4 : 1,
        }}
        transition={reduced
          ? { duration: 0 }
          : { type: 'spring', stiffness: 520, damping: 30, mass: 0.8 }}
      />
      <div className="splitter__tooltip" aria-hidden>
        {Math.round(leftPct)}%
      </div>
    </div>
  );
}
