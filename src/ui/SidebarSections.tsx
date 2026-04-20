import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { t } from '@/lib/translate';
import type { CategoryType, MLStr } from '@/types/content';

const NEW_MENU: CategoryType[] = [
  'cover', 'about', 'personal-info', 'body-info', 'training', 'abilities',
  'experiences-gallery', 'experiences-tv', 'film-categories', 'media', 'contact', 'thankyou',
];

// Scroll the first .page of a given category into view. Used by the static
// (viewer-mode) sidebar as a table of contents. In edit mode selection still
// drives the editor form; scrolling is a viewer-only convenience.
function scrollToCategory(catId: string) {
  const el = document.querySelector<HTMLElement>(`.page[data-cat-id="${catId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SidebarSections() {
  const lang     = useStore(s => s.lang);
  const content  = useStore(s => s.content);
  const selected = useStore(s => s.selectedId);
  const select   = useStore(s => s.select);
  const add      = useStore(s => s.addCategory);
  const move     = useStore(s => s.reorderCategory);
  const isStatic = useStore(s => s.isStatic);

  if (!content) return <aside className="sidebar app__list"><div className="sidebar__body" /></aside>;

  return (
    <aside className="sidebar app__list" aria-label="Sections">
      <div className="sidebar__head">
        <h3>{ui(lang, 'sidebar.sections')}</h3>
        {isStatic ? null : (
          <details className="sidebar__add">
            <summary className="btn--xs" title={ui(lang, 'sidebar.add.tooltip')}>
              {ui(lang, 'sidebar.add')}
            </summary>
            <div className="sidebar__add-menu">
              {NEW_MENU.map(ty => (
                <button
                  key={ty}
                  className="sidebar__add-menu-btn"
                  onClick={(e) => {
                    (e.currentTarget.closest('details') as HTMLDetailsElement).open = false;
                    add(ty);
                  }}
                >{ui(lang, 'type.' + ty)}</button>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="sidebar__body">
        <div className="cat-list">
          {content.categories.map(c => {
            const data = (c.data ?? {}) as { heading?: MLStr; portfolio_label?: MLStr };
            const title = t(data.heading ?? data.portfolio_label ?? c.id, lang) || c.id;
            const kind  = ui(lang, 'type.' + c.type);
            // Editor-mode: clicking selects (drives editor form); drag reorders.
            // Viewer-mode: clicking smooth-scrolls to that section's first page.
            const dragHandlers = isStatic ? {} : {
              draggable: true,
              onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
                (e.currentTarget as HTMLElement).classList.add('is-dragging');
                e.dataTransfer.setData('text/plain', c.id);
                e.dataTransfer.effectAllowed = 'move';
              },
              onDragEnd:  (e: React.DragEvent<HTMLDivElement>) =>
                (e.currentTarget as HTMLElement).classList.remove('is-dragging'),
              onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              },
              onDrop:     (e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                const from = e.dataTransfer.getData('text/plain');
                if (from && from !== c.id) move(from, c.id);
              },
            };
            return (
              <div
                key={c.id}
                className={'cat-item' + (c.id === selected ? ' is-active' : '')}
                onClick={() => {
                  if (isStatic) scrollToCategory(c.id);
                  else          select(c.id);
                }}
                {...dragHandlers}
              >
                {isStatic ? null : <span className="cat-item__handle" aria-hidden>⋮⋮</span>}
                <div className="cat-item__title" title={title}>{title}</div>
                <span className="cat-item__type" title={c.type}>{kind}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isStatic ? null : (
        <footer className="sidebar__footer">
          {ui(lang, 'sidebar.footer')} <code>content.json</code>.
        </footer>
      )}
    </aside>
  );
}
