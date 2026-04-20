import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { editorForType } from '@/editors';
import type { Category } from '@/types/content';
import formCss from '@/editors/forms.module.css';

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
          <>
            <div className={formCss.card} style={{ marginBottom: 12 }}>
              <div className="card__title">
                <span>
                  <span className="dot" />
                  <span style={{ marginLeft: 8 }}>{ui(lang, 'type.' + cat.type)}</span>
                </span>
              </div>
              <div className={formCss.row}>
                <div className={formCss.label}>{ui(lang, 'editor.id')}</div>
                <input
                  className={formCss.input}
                  value={cat.id}
                  readOnly
                />
              </div>
            </div>
            <EditorFor cat={cat} />
          </>
        )}
      </div>
    </aside>
  );
}

function EditorFor({ cat }: { cat: Category }) {
  const Editor = editorForType(cat.type);
  return <Editor cat={cat as never} />;
}
