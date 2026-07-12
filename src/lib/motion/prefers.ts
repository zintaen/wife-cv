// ============================================================================
// Motion gate — the single source of truth for "may I animate?". Every motion
// primitive consults these helpers before attaching listeners. Respects:
//   - prefers-reduced-motion (user OS setting, authoritative)
//   - coarse pointer / touch (skip desktop-only effects: smooth-scroll, cursor)
//   - low-memory heuristics for WebGL (devicePixelRatio caps)
// Exports are lazy — never touches window at module scope so SSR/build is safe.
// ============================================================================

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

export function isTouch(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // hover:none & pointer:coarse is the reliable combo for phones + tablets.
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  } catch { return false; }
}

/**
 * Subscribe to reduced-motion changes. Returns an unsubscribe.
 */
export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => cb(mq.matches);
  // addEventListener is supported everywhere we care about; older browsers use addListener.
  if ('addEventListener' in mq) mq.addEventListener('change', handler);
  else (mq as MediaQueryList & { addListener(cb: () => void): void }).addListener(handler);
  return () => {
    if ('removeEventListener' in mq) mq.removeEventListener('change', handler);
    else (mq as MediaQueryList & { removeListener(cb: () => void): void }).removeListener(handler);
  };
}

/**
 * True when desktop-caliber interactions are appropriate: hover pointer + no
 * reduced-motion request. The custom cursor, smooth-scroll hijack, magnetic
 * pull, and WebGL shader-image all gate on this.
 */
export function allowsDesktopFx(): boolean {
  return !isTouch() && !isReducedMotion();
}
