import { motion, useReducedMotion, useMotionValue, useTransform, useDragControls, type PanInfo } from 'framer-motion';
import type { ReactNode } from 'react';

// -----------------------------------------------------------------------------
// StudioDrawer — responsive motion shell for the left panel when viewport
// collapses to drawer mode. Behavior forks on viewport:
//   • ≥768 and <960 (tablet) — slide in from the LEFT like a classic drawer
//   • <768 (phone) — slide up from the BOTTOM as a sheet with a grab handle
//                    at the top. The handle alone is the drag affordance,
//                    so body content (sidebar, editor, style dock) remains
//                    fully scrollable without hijacking the gesture.
// A framer-motion `useMotionValue` tracks vertical offset on the sheet and
// a `useTransform` fades the scrim opacity in sync, so the light behind the
// sheet dims/brightens as the user pulls. Above a threshold (or with enough
// flick velocity) the drawer dismisses.
// -----------------------------------------------------------------------------
export function StudioDrawer({
  open, onClose, isMobile, children,
}: {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  children: ReactNode;
}) {
  const reduced       = useReducedMotion();
  const y             = useMotionValue(0);
  // Dim the scrim as the sheet slides down — full at y=0, transparent at 280.
  const scrimOpacity  = useTransform(y, [0, 280], [1, 0]);
  const dragControls  = useDragControls();

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const shouldDismiss = info.offset.y > 120 || info.velocity.y > 600;
    if (shouldDismiss) onClose();
    else y.set(0);
  };

  // Spring profile is firm enough to feel mechanical but not stiff.
  const spring = { type: 'spring' as const, stiffness: 420, damping: 42, mass: 0.9 };

  return (
    <>
      <motion.button
        type="button"
        className="shell__scrim"
        aria-label="Close controls"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={isMobile ? { opacity: scrimOpacity } : undefined}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.aside
        className="panel panel--left panel--drawer is-open"
        aria-label="Studio controls"
        initial={
          reduced
            ? { opacity: 0 }
            : isMobile
              ? { y: '100%' }
              : { x: '-100%' }
        }
        animate={reduced ? { opacity: 1 } : isMobile ? { y: 0 } : { x: 0 }}
        exit={
          reduced
            ? { opacity: 0 }
            : isMobile
              ? { y: '100%' }
              : { x: '-100%' }
        }
        transition={spring}
        drag={isMobile && !reduced ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.28 }}
        onDragEnd={onDragEnd}
        style={isMobile && !reduced ? { y } : undefined}
      >
        {isMobile ? (
          <div
            className="panel--drawer__handle"
            aria-hidden
            onPointerDown={(e) => dragControls.start(e)}
          >
            <span className="panel--drawer__grip" />
          </div>
        ) : null}
        <div className="panel--drawer__scroll">
          {children}
        </div>
      </motion.aside>
    </>
  );
}
