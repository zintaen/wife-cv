import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { t } from '@/lib/translate';
import type { CategoryType, MLStr } from '@/types/content';

const NEW_MENU: CategoryType[] = [
  'cover', 'about', 'personal-info', 'body-info', 'training', 'abilities',
  'experiences-gallery', 'experiences-tv', 'film-categories', 'media', 'contact', 'thankyou',
];

export function SidebarSections() {
  const lang     = useStore(s => s.lang);
  const content  = useStore(s => s.content);
  const selected = useStore(s => s.selectedId);
  const select   = useStore(s => s.select);
  const add      = useStore(s => s.addCategory);
  const move     = useStore(s => s.reorderCategory);

  if (!content) return <aside className="sidebar app__list"><div className="sidebar__body" /></aside>;

  return (
    <aside className="sidebar app__list" aria-label="Sections">
      <div className="sidebar__head">
        <h3>{ui(lang, 'sidebar.sections')}</h3>
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
      </div>

      <div className="sidebar__body">
        <div className="cat-list">
          {content.categories.map(c => {
            const data = (c.data ?? {}) as { heading?: MLStr; portfolio_label?: MLStr };
            const title = t(data.heading ?? data.portfolio_label ?? c.id, lang) || c.id;
            const kind  = ui(lang, 'type.' + c.type);
            return (
              <div
                key={c.id}
                className={'cat-item' + (c.id === selected ? ' is-active' : '')}
                onClick={() => select(c.id)}
                draggable
                onDragStart={e => {
                  (e.currentTarget as HTMLElement).classList.add('is-dragging');
                  e.dataTransfer.setData('text/plain', c.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={e => (e.currentTarget as HTMLElement).classList.remove('is-dragging')}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => {
                  e.preventDefault();
                  const from = e.dataTransfer.getData('text/plain');
                  if (from && from !== c.id) move(from, c.id);
                }}
              >
                <span className="cat-item__handle" aria-hidden>⋮⋮</span>
                <div className="cat-item__title" title={title}>{title}</div>
                <span className="cat-item__type" title={c.type}>{kind}</span>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="sidebar__footer">
        {ui(lang, 'sidebar.footer')} <code>content.json</code>.
      </footer>
    </aside>
  );
}
