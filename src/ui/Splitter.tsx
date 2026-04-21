import { useState } from 'react';

// Vertical drag handle that resizes the left/right split in .shell. Dragging
// to either edge snaps to 0% or 100% so the user can fully collapse one side
// and get the other at full width on small screens. Double-click resets the
// split to the given default (App seeds 40).
//
// The parent owns the numeric state and persists it; this component is a thin
// pointer-event wrapper. It uses setPointerCapture on pointerdown so the drag
// stays glued to this handle even when the cursor outruns it — which matters
// on narrow viewports where a slow drag is easy to lose.

export function Splitter({
  leftPct, setLeftPct, defaultPct = 40,
}: {
  leftPct: number;
  setLeftPct: (n: number) => void;
  defaultPct?: number;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={'splitter' + (dragging ? ' is-dragging' : '')}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(leftPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      title="Drag to resize. Drag to edge to collapse. Double-click to reset."
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
        // Snap to edges on outer 8% dead zones; otherwise keep the split
        // inside a usable band so users can't accidentally starve either
        // pane of working room.
        if (raw < 8)       setLeftPct(0);
        else if (raw > 92) setLeftPct(100);
        else               setLeftPct(Math.max(15, Math.min(85, raw)));
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setDragging(false);
        document.body.classList.remove('is-resizing');
      }}
      onDoubleClick={() => setLeftPct(defaultPct)}
    >
      <div className="splitter__grip" aria-hidden />
    </div>
  );
}
