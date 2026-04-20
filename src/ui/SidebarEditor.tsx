import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { editorForType } from '@/editors';

export function SidebarEditor() {
  const lang     = useStore(s => s.lang);
  const content  = useStore(s => s.content);
  const selected = useStore(s => s.selectedId);
  const del      = useStore(s => s.deleteCategory);

  const cat = useMemo(
    () => content?.categories.find(c => c.id === selected),
    [content, selected],
  );

  return (
    <aside className="sidebar app__editor" aria-label="Content editor">
      <div className="sidebar__head">
        <h3>{ui(lang, 'sidebar.edit')}</h3>
        {cat ? (
          <button
            className="btn--xs"
            onClick={() => {
              if (confirm(ui(lang, 'editor.deleteConfirm'))) del(cat.id);
            }}
          >{ui(lang, 'editor.delete')}</button>
        ) : null}
      </div>

      <div className="sidebar__body" style={{ padding: 14 }}>
        {!cat ? (
          <div style={{ color: 'var(--chrome-muted)', fontSize: 12 }}>
            {ui(lang, 'editor.empty')}
          </div>
        ) : (
          <EditorFor cat={cat} />
        )}
      </div>
    </aside>
  );
}

function EditorFor({ cat }: { cat: NonNullable<ReturnType<typeof pickCat>> }) {
  const Editor = editorForType(cat.type);
  return <Editor cat={cat as never} />;
}

// Type-only helper to keep EditorFor's prop type coherent without importing
// Category<T> with a dynamic type parameter.
function pickCat() {
  return useStore.getState().content?.categories[0];
}
