import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { editorForType } from '@/editors';
import type { Category } from '@/types/content';
import formCss from '@/editors/forms.module.css';

// -----------------------------------------------------------------------------
// Editor sidebar — the "inspector". Shows an empty state when nothing is
// selected, and crossfades the editor surface when the selected category
// changes. The identity card at the top stamps the category type with a
// monospace eyebrow + index stamp.
// -----------------------------------------------------------------------------
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
        <div className="sidebar__head-eyebrow">
          <span className="sidebar__head-num">02 /</span>
          <span className="sidebar__head-label">{ui(lang, 'sidebar.edit')}</span>
        </div>
        <h3 className="sidebar__head-title">{ui(lang, 'sidebar.edit')}</h3>
        {cat ? (
          <motion.button
            className="btn--xs sidebar__delete"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (confirm(ui(lang, 'editor.deleteConfirm'))) del(cat.id);
            }}
          >
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{ui(lang, 'editor.delete')}</span>
          </motion.button>
        ) : null}
      </div>

      <div className="sidebar__body sidebar__body--editor">
        <AnimatePresence mode="wait">
          {!cat ? (
            <motion.div
              key="empty"
              className="editor-empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="editor-empty__mark" aria-hidden>◉</span>
              <p className="editor-empty__text">{ui(lang, 'editor.empty')}</p>
            </motion.div>
          ) : (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={formCss.card + ' editor-id-card'}>
                <div className="card__title">
                  <span>
                    <span className="dot" />
                    <span className="editor-id-card__type">{ui(lang, 'type.' + cat.type)}</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function EditorFor({ cat }: { cat: Category }) {
  const Editor = editorForType(cat.type);
  return <Editor cat={cat as never} />;
}
