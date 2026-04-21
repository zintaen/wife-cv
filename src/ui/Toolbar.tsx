import { useStore, selectIsDirty } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Lang } from '@/types/content';

const LANGS: Lang[] = ['vi', 'en', 'zh'];
const LANG_LABEL: Record<Lang, string> = { vi: 'VI', en: 'EN', zh: '中' };

// Global toolbar. The Theme button toggles a styleOpen flag owned by App —
// when true, App renders <StyleDock> as the bottom section of the left panel.
// Toolbar no longer mounts StyleDock itself; that used to be a 4th grid
// column, which the new flex-split shell has eliminated.
export function Toolbar({
  styleOpen, onToggleStyle,
}: {
  styleOpen: boolean;
  onToggleStyle: () => void;
}) {
  const lang = useStore(s => s.lang);
  const setLang = useStore(s => s.setLang);
  const orientation = useStore(s => s.orientation);
  const setOrient   = useStore(s => s.setOrient);
  const save = useStore(s => s.save);
  const isDirty = useStore(selectIsDirty);
  const isStatic = useStore(s => s.isStatic);

  const statusCls = isStatic ? 'is-err' : isDirty ? 'is-dirty' : 'is-saved';
  const statusMsg = isStatic
    ? ui(lang, 'status.static')
    : isDirty ? ui(lang, 'status.dirty') : ui(lang, 'status.saved');

  return (
    <header className="toolbar app__toolbar" aria-label="Global controls">
        <div className="toolbar__brand" title={ui(lang, 'toolbar.brand')}>LT</div>
        <div className="toolbar__title">
          {ui(lang, 'toolbar.title')}
          <small>{ui(lang, 'toolbar.subtitle')}</small>
        </div>

        <div className="toolbar__spacer" />

        <div className="lang-seg" role="radiogroup" title={ui(lang, 'toolbar.lang')}>
          {LANGS.map(l => (
            <button
              key={l}
              className={'lang-seg__btn ' + (lang === l ? 'is-active' : '')}
              onClick={() => setLang(l)}
              role="radio"
              aria-checked={lang === l}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>

        <button
          className={'toolbar__btn ' + (styleOpen ? 'is-active' : '')}
          onClick={onToggleStyle}
          aria-haspopup="true" aria-pressed={styleOpen}
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
        </button>

        <button
          className="toolbar__btn toolbar__btn--icon"
          onClick={() => setOrient(orientation === 'landscape' ? 'portrait' : 'landscape')}
          title={ui(lang, orientation === 'landscape' ? 'toolbar.orient.landscape' : 'toolbar.orient.portrait')}
        >
          {orientation === 'landscape' ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={1.8}><rect x="3" y="6" width="18" height="12" rx="1.5"/></svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={1.8}><rect x="6" y="3" width="12" height="18" rx="1.5"/></svg>
          )}
        </button>

        <button
          className="toolbar__btn toolbar__btn--primary"
          onClick={save}
          disabled={isStatic}
          title={ui(lang, 'toolbar.save.tooltip')}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>{ui(lang, 'toolbar.save')}</span>
        </button>

        <button
          className="toolbar__btn toolbar__btn--icon"
          onClick={() => window.print()}
          title={ui(lang, 'toolbar.print.tooltip')}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>

        <div
          className={'toolbar__status ' + statusCls}
          role="status"
          aria-label={statusMsg}
          title={statusMsg}
        />

      </header>
  );
}
