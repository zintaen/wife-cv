import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore, selectIsDirty } from '@/store/useStore';
import { Toolbar } from '@/ui/Toolbar';
import { SidebarSections } from '@/ui/SidebarSections';
import { SidebarEditor } from '@/ui/SidebarEditor';
import { StyleDock } from '@/ui/StyleDock';
import { Splitter } from '@/ui/Splitter';
import { StudioDrawer } from '@/ui/StudioDrawer';
import { Portfolio } from '@/ui/Portfolio';
import { Toast } from '@/ui/Toast';
import { listFonts } from '@/lib/api';
import {
  applyThemeOverrides, injectCustomFontFaces, loadGoogleFont,
} from '@/lib/fonts';

// Tiny persisted-state hook. Keeps studio UI prefs (split ratio + styleOpen)
// in localStorage so the layout is stable across reloads. Intentionally out
// of the Zustand store — these are per-browser cosmetic prefs, not part of
// the saved document. Corrupt or missing JSON falls back to the initial.
function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : (JSON.parse(raw) as T);
    } catch { return initial; }
  });
  const set = (next: T) => {
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
  };
  return [v, set];
}

export function App() {
  const load = useStore(s => s.load);
  const save = useStore(s => s.save);
  const isDirty = useStore(selectIsDirty);
  const isStatic = useStore(s => s.isStatic);

  const vibe          = useStore(s => s.vibe);
  const vibeOverrides = useStore(s => s.vibeOverrides);
  const googleFonts   = useStore(s => s.googleFonts);
  const setCustomFonts = useStore(s => s.setCustomFonts);

  // Studio layout prefs. The split is a percentage 0–100; 0 and 100 fully
  // collapse one side so the opposite pane owns the whole shell (the main
  // fix for narrow screens). The style dock starts open so first-time users
  // see the theme + font controls, and the key is scoped under studio.* so
  // these don't collide with any future persisted content keys.
  const [leftPct, setLeftPct]     = usePersisted('studio.leftPct', 40);
  const [styleOpen, setStyleOpen] = usePersisted('studio.styleOpen', true);

  // Responsive — below 960 the preview takes the full shell and the sidebars
  // collapse into a drawer. Below 768 the drawer becomes a bottom sheet with
  // drag-to-dismiss. The splitter hides on narrow screens.
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches,
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mqNarrow = window.matchMedia('(max-width: 960px)');
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const onNarrow = () => setIsNarrow(mqNarrow.matches);
    const onMobile = () => setIsMobile(mqMobile.matches);
    mqNarrow.addEventListener('change', onNarrow);
    mqMobile.addEventListener('change', onMobile);
    return () => {
      mqNarrow.removeEventListener('change', onNarrow);
      mqMobile.removeEventListener('change', onMobile);
    };
  }, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Close the drawer when the viewport widens back out.
  useEffect(() => { if (!isNarrow) setDrawerOpen(false); }, [isNarrow]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    document.body.classList.toggle('is-static', isStatic);
    return () => { document.body.classList.remove('is-static'); };
  }, [isStatic]);

  // Pull the custom-font library from the server once on boot, then inject
  // @font-face rules so families are available to the <select>s + previews.
  useEffect(() => {
    listFonts()
      .then(fonts => { setCustomFonts(fonts); injectCustomFontFaces(fonts); })
      .catch(() => {/* static mode or offline — no-op */});
  }, [setCustomFonts]);

  // Replay any Google Fonts saved in content.meta.google_fonts (once they've
  // been hydrated by load()). The loader is idempotent.
  useEffect(() => {
    googleFonts.forEach(f => loadGoogleFont(f));
  }, [googleFonts]);

  // Push per-vibe overrides onto <body> whenever vibe or overrides change.
  useEffect(() => {
    applyThemeOverrides(vibeOverrides[vibe]);
  }, [vibe, vibeOverrides]);

  // ⌘S / Ctrl-S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDirty, save]);

  // Fully-collapsed sides get .is-hidden so the opposite pane's flex:1
  // claims the whole shell. We still render the Splitter — it's the user's
  // only way back from 0 or 100.
  const leftHidden    = leftPct <= 0;
  const previewHidden = leftPct >= 100;

  return (
    <div className="app">
      <Toolbar
        styleOpen={styleOpen}
        onToggleStyle={() => setStyleOpen(!styleOpen)}
        isNarrow={isNarrow}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
      />
      <div className={'shell' + (isNarrow ? ' shell--narrow' : '')}>
        {/* Desktop/widescreen: inline flex aside pinned to the left. */}
        {isNarrow ? null : (
          <aside
            className={
              'panel panel--left'
              + (leftHidden ? ' is-hidden' : '')
            }
            style={{ flexBasis: leftPct + '%' }}
            aria-label="Studio controls"
          >
            <SidebarSections />
            {isStatic ? null : <SidebarEditor />}
            {styleOpen ? <StyleDock onClose={() => setStyleOpen(false)} /> : null}
          </aside>
        )}

        {isNarrow ? null : <Splitter leftPct={leftPct} setLeftPct={setLeftPct} />}

        <main
          className={
            'panel panel--preview'
            + (previewHidden && !isNarrow ? ' is-hidden' : '')
          }
          aria-label="Preview"
        >
          <Portfolio />
        </main>

        {/* Narrow viewports: framer-motion drawer (springs from the left on
            tablet, bottom-sheet with drag-to-dismiss on phone). */}
        {isNarrow ? (
          <AnimatePresence>
            {drawerOpen ? (
              <StudioDrawer
                key="drawer"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                isMobile={isMobile}
              >
                <SidebarSections />
                {isStatic ? null : <SidebarEditor />}
                {styleOpen ? <StyleDock onClose={() => setStyleOpen(false)} /> : null}
              </StudioDrawer>
            ) : null}
          </AnimatePresence>
        ) : null}
      </div>
      <Toast />
    </div>
  );
}
