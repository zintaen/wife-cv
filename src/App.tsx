import { useEffect } from 'react';
import { useStore, selectIsDirty } from '@/store/useStore';
import { Toolbar } from '@/ui/Toolbar';
import { SidebarSections } from '@/ui/SidebarSections';
import { SidebarEditor } from '@/ui/SidebarEditor';
import { Portfolio } from '@/ui/Portfolio';
import { Toast } from '@/ui/Toast';
import { listFonts } from '@/lib/api';
import {
  applyThemeOverrides, injectCustomFontFaces, loadGoogleFont,
} from '@/lib/fonts';

export function App() {
  const load = useStore(s => s.load);
  const save = useStore(s => s.save);
  const isDirty = useStore(selectIsDirty);
  const isStatic = useStore(s => s.isStatic);

  const vibe          = useStore(s => s.vibe);
  const vibeOverrides = useStore(s => s.vibeOverrides);
  const googleFonts   = useStore(s => s.googleFonts);
  const setCustomFonts = useStore(s => s.setCustomFonts);

  useEffect(() => { load(); }, [load]);

  // In static deploys (no Node API) we collapse the editor columns and show
  // only the preview + dock. CSS keys off body.is-static.
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
  // Legacy portfolio.js does the same thing on theme switch + setOverride.
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

  return (
    <div className="app">
      <Toolbar />
      {/* Left sidebar acts as a section navigator in static mode (no Add /
          drag / editor footer); full editor chrome in dev. */}
      <SidebarSections />
      {isStatic ? null : <SidebarEditor />}
      <Portfolio />
      <Toast />
    </div>
  );
}
