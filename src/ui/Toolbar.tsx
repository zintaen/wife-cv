import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useStore, selectIsDirty } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Lang } from '@/types/content';
import { useMagnetic } from '@/lib/motion';

const LANGS: Lang[] = ['vi', 'en', 'zh'];
const LANG_LABEL: Record<Lang, string> = { vi: 'VI', en: 'EN', zh: '中' };

// -----------------------------------------------------------------------------
// MagneticButton — tiny wrapper that applies `useMagnetic` to a native <button>.
// framer-motion drives the tap-down press-in feedback; the magnetic translate
// comes from our rAF hook (it handles touch + reduced-motion checks internally).
// -----------------------------------------------------------------------------
type MagneticButtonProps = {
  className?: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'grid' | 'listbox' | 'tree' | 'true' | 'false';
  'aria-pressed'?: boolean;
  strength?: number;
};
function MagneticButton({
  className, title, disabled, onClick, children, strength, ...aria
}: MagneticButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>({ strength: strength ?? 0.28, radius: 24 });
  return (
    <motion.button
      ref={ref}
      className={className}
      title={title}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      {...aria}
    >
      {children}
    </motion.button>
  );
}

// -----------------------------------------------------------------------------
// Global toolbar — editorial command bar.
// ▸ serif-italic wordmark + mono subtitle stamp
// ▸ animated segmented lang switcher (layoutId indicator slides between chips)
// ▸ magnetic hover on every button; spring scale on tap
// ▸ save button pulses when dirty; the status dot morphs color + emits a tick
// ▸ drawer hamburger→X morph on narrow screens
// App owns state; toolbar is a pure view.
// -----------------------------------------------------------------------------
export function Toolbar({
  styleOpen, onToggleStyle,
  isNarrow = false, drawerOpen = false, onToggleDrawer,
}: {
  styleOpen: boolean;
  onToggleStyle: () => void;
  isNarrow?: boolean;
  drawerOpen?: boolean;
  onToggleDrawer?: () => void;
}) {
  const lang = useStore(s => s.lang);
  const setLang = useStore(s => s.setLang);
  const orientation = useStore(s => s.orientation);
  const setOrient   = useStore(s => s.setOrient);
  const save = useStore(s => s.save);
  const isDirty = useStore(selectIsDirty);
  const isStatic = useStore(s => s.isStatic);
  const reduced = useReducedMotion();

  const statusCls = isStatic ? 'is-err' : isDirty ? 'is-dirty' : 'is-saved';
  const statusMsg = isStatic
    ? ui(lang, 'status.static')
    : isDirty ? ui(lang, 'status.dirty') : ui(lang, 'status.saved');

  // Prevents the "save" pulse from getting stuck by letting framer key off
  // the dirty flag — when we enter the dirty state, the animation kicks.
  const saveRef = useRef<HTMLDivElement>(null);

  return (
    <header className="toolbar app__toolbar" aria-label="Global controls">
      {isNarrow && onToggleDrawer ? (
        <motion.button
          className={'toolbar__btn toolbar__btn--icon toolbar__drawer-toggle ' + (drawerOpen ? 'is-active' : '')}
          onClick={onToggleDrawer}
          aria-label="Toggle studio controls"
          aria-pressed={drawerOpen}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.svg
              key={drawerOpen ? 'x' : 'menu'}
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? { opacity: 0 } : { rotate: -45, opacity: 0, scale: 0.6 }}
              animate={reduced ? { opacity: 1 } : { rotate: 0, opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { rotate: 45, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {drawerOpen
                ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
                : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>
              }
            </motion.svg>
          </AnimatePresence>
        </motion.button>
      ) : null}

      <div className="toolbar__brand" title={ui(lang, 'toolbar.brand')}>
        <span className="toolbar__brand-mark">LT</span>
      </div>

      <div className="toolbar__title">
        <span className="toolbar__title-name">{ui(lang, 'toolbar.title')}</span>
        <small className="toolbar__title-stamp">
          <span className="toolbar__title-stamp-dot" aria-hidden />
          {ui(lang, 'toolbar.subtitle')}
        </small>
      </div>

      <div className="toolbar__spacer" />

      <div className="lang-seg" role="radiogroup" title={ui(lang, 'toolbar.lang')}>
        {LANGS.map(l => {
          const active = lang === l;
          return (
            <button
              key={l}
              className={'lang-seg__btn ' + (active ? 'is-active' : '')}
              onClick={() => setLang(l)}
              role="radio"
              aria-checked={active}
            >
              {active ? (
                <motion.span
                  layoutId="lang-seg-indicator"
                  className="lang-seg__indicator"
                  transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.9 }}
                />
              ) : null}
              <span className="lang-seg__label">{LANG_LABEL[l]}</span>
            </button>
          );
        })}
      </div>

      <MagneticButton
        className={'toolbar__btn ' + (styleOpen ? 'is-active' : '')}
        onClick={onToggleStyle}
        aria-haspopup="true"
        aria-pressed={styleOpen}
        title={ui(lang, 'toolbar.theme')}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="8.5"  cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5"  cy="12.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <path d="M12 2a10 10 0 0 0 0 20 5 5 0 0 0 5-5c0-1.5-1-2-2-2h-2a3 3 0 0 1 0-6h4.5A5.5 5.5 0 0 0 12 2z"/>
        </svg>
        <span>{ui(lang, 'toolbar.theme')}</span>
      </MagneticButton>

      <MagneticButton
        className="toolbar__btn toolbar__btn--icon"
        onClick={() => setOrient(orientation === 'landscape' ? 'portrait' : 'landscape')}
        title={ui(lang, orientation === 'landscape' ? 'toolbar.orient.landscape' : 'toolbar.orient.portrait')}
        aria-label={ui(lang, orientation === 'landscape' ? 'toolbar.orient.landscape' : 'toolbar.orient.portrait')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.svg
            key={orientation}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            initial={reduced ? { opacity: 0 } : { rotate: orientation === 'landscape' ? -90 : 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { rotate: orientation === 'landscape' ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {orientation === 'landscape'
              ? <rect x="3" y="6" width="18" height="12" rx="1.5"/>
              : <rect x="6" y="3" width="12" height="18" rx="1.5"/>
            }
          </motion.svg>
        </AnimatePresence>
      </MagneticButton>

      <motion.div
        ref={saveRef}
        className={'toolbar__save-wrap' + (isDirty && !isStatic ? ' is-dirty' : '')}
        animate={isDirty && !isStatic && !reduced
          ? { scale: [1, 1.04, 1] }
          : { scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut', repeat: isDirty && !isStatic ? Infinity : 0, repeatType: 'loop' }}
      >
        <MagneticButton
          className="toolbar__btn toolbar__btn--primary"
          onClick={save}
          disabled={isStatic}
          title={ui(lang, 'toolbar.save.tooltip')}
          strength={0.22}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>{ui(lang, 'toolbar.save')}</span>
        </MagneticButton>
      </motion.div>

      <MagneticButton
        className="toolbar__btn toolbar__btn--icon"
        onClick={() => window.print()}
        title={ui(lang, 'toolbar.print.tooltip')}
        aria-label={ui(lang, 'toolbar.print.tooltip')}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      </MagneticButton>

      <div
        className={'toolbar__status ' + statusCls}
        role="status"
        aria-label={statusMsg}
        title={statusMsg}
      >
        <motion.span
          className="toolbar__status-dot"
          aria-hidden
          animate={isDirty && !isStatic && !reduced
            ? { scale: [1, 1.5, 1], opacity: [1, 0.7, 1] }
            : { scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, repeat: isDirty && !isStatic ? Infinity : 0, ease: 'easeInOut' }}
        />
        <span className="toolbar__status-label">
          {isStatic ? 'STATIC' : isDirty ? 'DRAFT' : 'SAVED'}
        </span>
      </div>
    </header>
  );
}
