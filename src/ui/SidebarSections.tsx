import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { CategoryType } from '@/types/content';

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
        <details style={{ position: 'relative' }}>
          <summary className="btn--xs" title={ui(lang, 'sidebar.add.tooltip')}>
            {ui(lang, 'sidebar.add')}
          </summary>
          <div style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 5,
            background: 'var(--chrome-bg)', border: '1px solid var(--chrome-rule)',
            minWidth: 180, padding: 4,
          }}>
            {NEW_MENU.map(t => (
              <button
                key={t}
                className="btn--xs"
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, padding: '6px 10px' }}
                onClick={(e) => {
                  (e.currentTarget.closest('details') as HTMLDetailsElement).open = false;
                  add(t);
                }}
              >{t}</button>
            ))}
          </div>
        </details>
      </div>

      <div className="sidebar__body">
        <div className="cat-list">
          {content.categories.map((c, i) => (
            <button
              key={c.id}
              className={'cat-row ' + (c.id === selected ? 'is-active' : '')}
              onClick={() => select(c.id)}
              draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', c.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const from = e.dataTransfer.getData('text/plain');
                if (from && from !== c.id) move(from, c.id);
              }}
            >
              <span className="cat-row__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="cat-row__id">{c.id}</span>
              <span className="cat-row__type">{c.type}</span>
              <span className="cat-row__drag" title="drag to reorder">≡</span>
            </button>
          ))}
        </div>
      </div>

      <footer className="sidebar__footer">{ui(lang, 'sidebar.footer')}</footer>
    </aside>
  );
}
