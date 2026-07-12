import { useMemo, useRef } from 'react';
import { AnimatePresence, Reorder, motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { t } from '@/lib/translate';
import type { CategoryType, MLStr } from '@/types/content';

const NEW_MENU: CategoryType[] = [
  'cover', 'about', 'personal-info', 'body-info', 'training', 'abilities',
  'experiences-gallery', 'experiences-tv', 'film-categories', 'media', 'contact', 'thankyou',
];

// Scroll the first .page of a given category into view. Used by the static
// (viewer-mode) sidebar as a table of contents.
function scrollToCategory(catId: string) {
  const el = document.querySelector<HTMLElement>(`.page[data-cat-id="${catId}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// -----------------------------------------------------------------------------
// Sidebar navigator — editorial index card.
// In edit mode the list is a framer-motion Reorder.Group: dragging a row
// springs the others out of the way. In static mode it's a plain list that
// smooth-scrolls to the matching section on click.
// -----------------------------------------------------------------------------
export function SidebarSections() {
  const lang     = useStore(s => s.lang);
  const content  = useStore(s => s.content);
  const selected = useStore(s => s.selectedId);
  const select   = useStore(s => s.select);
  const add      = useStore(s => s.addCategory);
  const setOrder = useStore(s => s.setCategoryOrder);
  const isStatic = useStore(s => s.isStatic);
  const reduced  = useReducedMotion();

  const ids = useMemo(
    () => (content?.categories ?? []).map(c => c.id),
    [content],
  );

  if (!content) return <aside className="sidebar app__list"><div className="sidebar__body" /></aside>;

  return (
    <aside className="sidebar app__list" aria-label="Sections">
      <div className="sidebar__head">
        <div className="sidebar__head-eyebrow">
          <span className="sidebar__head-num">01 /</span>
          <span className="sidebar__head-label">{ui(lang, 'sidebar.sections')}</span>
        </div>
        <h3 className="sidebar__head-title">{ui(lang, 'sidebar.sections')}</h3>
        {isStatic ? null : (
          <details className="sidebar__add">
            <summary className="btn--xs sidebar__add-trigger" title={ui(lang, 'sidebar.add.tooltip')}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>{ui(lang, 'sidebar.add')}</span>
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
                >
                  <span className="sidebar__add-menu-btn-icon" aria-hidden />
                  {ui(lang, 'type.' + ty)}
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="sidebar__body">
        {isStatic ? (
          <StaticList
            ids={ids}
            content={content}
            lang={lang}
            selected={selected}
          />
        ) : (
          <Reorder.Group
            axis="y"
            values={ids}
            onReorder={setOrder}
            className="cat-list"
            as="div"
            layoutScroll
          >
            <AnimatePresence initial={false}>
              {content.categories.map((c, idx) => {
                const data = (c.data ?? {}) as { heading?: MLStr; portfolio_label?: MLStr };
                const title = t(data.heading ?? data.portfolio_label ?? c.id, lang) || c.id;
                const kind  = ui(lang, 'type.' + c.type);
                const isActive = c.id === selected;
                return (
                  <ReorderItem
                    key={c.id}
                    id={c.id}
                    idx={idx}
                    title={title}
                    kind={kind}
                    isActive={isActive}
                    onSelect={() => select(c.id)}
                    reduced={!!reduced}
                  />
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {isStatic ? null : (
        <footer className="sidebar__footer">
          <span className="sidebar__footer-rule" aria-hidden />
          <span>{ui(lang, 'sidebar.footer')} <code>content.json</code>.</span>
        </footer>
      )}
    </aside>
  );
}

// -----------------------------------------------------------------------------
// Draggable row — encapsulated as its own component so each item is isolated
// for framer-motion layout animations. The drag handle is a visual affordance;
// the whole row is draggable for touch friendliness.
// -----------------------------------------------------------------------------
function ReorderItem({
  id, idx, title, kind, isActive, onSelect, reduced,
}: {
  id: string;
  idx: number;
  title: string;
  kind: string;
  isActive: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const dragStartY = useRef<number | null>(null);
  return (
    <Reorder.Item
      value={id}
      as="div"
      className={'cat-item' + (isActive ? ' is-active' : '')}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.02, 0.16) }}
      whileDrag={{
        scale: 1.02,
        zIndex: 5,
        boxShadow:
          '0 1px 0 rgba(255,255,255,.9) inset, 0 12px 30px -10px rgba(27,22,18,.35), 0 22px 48px -16px rgba(27,22,18,.22)',
      }}
      whileHover={reduced ? undefined : { x: 2 }}
      dragListener={true}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => { dragStartY.current = e.clientY; }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // Suppress click-to-select if the pointer moved — that was a drag.
        const dy = dragStartY.current != null ? Math.abs(e.clientY - dragStartY.current) : 0;
        dragStartY.current = null;
        if (dy > 4) return;
        onSelect();
      }}
    >
      <span className="cat-item__index" aria-hidden>
        {String(idx + 1).padStart(2, '0')}
      </span>
      <span className="cat-item__handle" aria-label="Drag to reorder">
        <svg width={10} height={14} viewBox="0 0 10 14" fill="none" stroke="currentColor"
             strokeWidth={1.4} strokeLinecap="round">
          <circle cx="3" cy="3"  r=".6" fill="currentColor"/>
          <circle cx="7" cy="3"  r=".6" fill="currentColor"/>
          <circle cx="3" cy="7"  r=".6" fill="currentColor"/>
          <circle cx="7" cy="7"  r=".6" fill="currentColor"/>
          <circle cx="3" cy="11" r=".6" fill="currentColor"/>
          <circle cx="7" cy="11" r=".6" fill="currentColor"/>
        </svg>
      </span>
      <div className="cat-item__main">
        <div className="cat-item__title" title={title}>{title}</div>
        <span className="cat-item__type" title={kind}>{kind}</span>
      </div>
      {isActive ? (
        <motion.span
          layoutId="cat-item-active-bar"
          className="cat-item__active-bar"
          aria-hidden
          transition={{ type: 'spring', stiffness: 520, damping: 38 }}
        />
      ) : null}
    </Reorder.Item>
  );
}

// -----------------------------------------------------------------------------
// Static table-of-contents — used by the viewer when editing is disabled.
// Numbered index, title + kind, click scrolls with smooth-scroll.
// -----------------------------------------------------------------------------
function StaticList({
  ids, content, lang, selected,
}: {
  ids: string[];
  content: NonNullable<ReturnType<typeof useStore.getState>['content']>;
  lang: ReturnType<typeof useStore.getState>['lang'];
  selected: ReturnType<typeof useStore.getState>['selectedId'];
}) {
  return (
    <div className="cat-list">
      {ids.map((id, idx) => {
        const c = content.categories.find(cc => cc.id === id)!;
        const data = (c.data ?? {}) as { heading?: MLStr; portfolio_label?: MLStr };
        const title = t(data.heading ?? data.portfolio_label ?? c.id, lang) || c.id;
        const kind  = ui(lang, 'type.' + c.type);
        const isActive = c.id === selected;
        return (
          <motion.button
            key={c.id}
            type="button"
            className={'cat-item cat-item--static' + (isActive ? ' is-active' : '')}
            onClick={() => scrollToCategory(c.id)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.02, 0.16) }}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="cat-item__index" aria-hidden>
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="cat-item__main">
              <div className="cat-item__title" title={title}>{title}</div>
              <span className="cat-item__type" title={kind}>{kind}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
