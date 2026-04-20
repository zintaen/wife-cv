import { useEffect } from 'react';
import { useStore, selectIsDirty } from '@/store/useStore';
import { Toolbar } from '@/ui/Toolbar';
import { SidebarSections } from '@/ui/SidebarSections';
import { SidebarEditor } from '@/ui/SidebarEditor';
import { Portfolio } from '@/ui/Portfolio';
import { Toast } from '@/ui/Toast';

export function App() {
  const load = useStore(s => s.load);
  const save = useStore(s => s.save);
  const isDirty = useStore(selectIsDirty);

  useEffect(() => { load(); }, [load]);

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
      <SidebarSections />
      <SidebarEditor />
      <Portfolio />
      <Toast />
    </div>
  );
}
