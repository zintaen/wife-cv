import { useRef, useState } from 'react';
import css from './forms.module.css';
import type { Lang, MLStr } from '@/types/content';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import { uploadImage } from '@/lib/api';
import { fileToDataUrl } from '@/lib/fonts';

const LANGS: Lang[] = ['vi', 'en', 'zh'];

/** Small helper: read the current lang from the store (outside components). */
function useLang(): Lang {
  return useStore(s => s.lang);
}

export function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div className={css.row}>
      <div className={css.label}>{props.label}</div>
      {props.children}
    </div>
  );
}

export function MLInput(props: {
  label: string;
  value: MLStr | undefined;
  onChange: (next: MLStr) => void;
  multiline?: boolean;
}) {
  const v: MLStr = { vi: '', en: '', zh: '', ...(props.value ?? {}) };
  const [tab, setTab] = useState<Lang>('vi');
  return (
    <div className={css.row}>
      <div className={css.label} style={{ display: 'flex', gap: 8 }}>
        <span>{props.label}</span>
        <div className={css.langTabs}>
          {LANGS.map(l => (
            <button
              key={l}
              className={css.langTab + (tab === l ? ' ' + css.active : '')}
              onClick={() => setTab(l)}
              type="button"
            >{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {props.multiline ? (
        <textarea
          className={css.area}
          value={v[tab]}
          onChange={e => props.onChange({ ...v, [tab]: e.target.value })}
        />
      ) : (
        <input
          className={css.input}
          value={v[tab]}
          onChange={e => props.onChange({ ...v, [tab]: e.target.value })}
        />
      )}
    </div>
  );
}

export function TextInput(props: {
  label: string; value: string; onChange: (s: string) => void; placeholder?: string;
}) {
  return (
    <Field label={props.label}>
      <input
        className={css.input}
        value={props.value ?? ''}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </Field>
  );
}

/**
 * Image field: text box for a manual path + a file picker that uploads
 * the chosen file via POST /api/images and writes the returned URL into
 * the field. Falls back gracefully in static mode — the editor chrome
 * is already hidden there, so this only ever mounts when the Node
 * server is up. Shows a 36×36 thumbnail of the current value so you
 * can see what's referenced without cross-checking the preview.
 */
export function ImageInput(props: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  const lang = useLang();
  const showToast = useStore(s => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
      const url = await uploadImage(safe, dataUrl);
      props.onChange(url);
      showToast(ui(lang, 'field.image.uploaded'), 'ok');
    } catch (err) {
      showToast((err as Error).message, 'err');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Thumbnails use the same path convention as <Portfolio>: values like
  // "images/foo.jpg" are relative to the site root. Normalize to "/..."
  // so the thumbnail resolves the same way regardless of the editor's
  // current URL.
  const src = props.value
    ? (/^(https?:|data:|\/)/.test(props.value) ? props.value : '/' + props.value)
    : '';

  return (
    <div className={css.row}>
      <div className={css.label}>{props.label}</div>
      <div className={css.imageRow}>
        {src
          ? <img className={css.imageThumb} src={src} alt="" />
          : <span className={css.imageThumbPlaceholder} aria-hidden>□</span>}
        <input
          className={css.input}
          value={props.value ?? ''}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          style={{ display: 'none' }}
        />
        <button
          className="btn--xs"
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title={ui(lang, 'field.image.pick')}
        >{busy ? ui(lang, 'field.image.uploading') : ui(lang, 'field.image.pick')}</button>
        {props.value
          ? <button
              className="btn--xs"
              type="button"
              onClick={() => props.onChange('')}
              title={ui(lang, 'field.image.clear')}
              disabled={busy}
            >×</button>
          : null}
      </div>
    </div>
  );
}

/**
 * A single item in an ordered list (Field, Program, Play, etc.).
 * Renders the legacy-style header: ⋮⋮ #n ↑ ↓ × , matching the
 * `.cat-item__head` pattern from .legacy/styles/base.css.
 */
export function ListItem(props: {
  index: number;
  total: number;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const lang = useLang();
  const canUp = props.index > 0;
  const canDown = props.index < props.total - 1;
  return (
    <div className={css.card}>
      <div className={css.itemHead}>
        <span className={css.itemHandle}>⋮⋮</span>
        <span className={css.itemNum}>#{props.index + 1}</span>
        <div className={css.itemActions}>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => props.onUp?.()}
            disabled={!canUp || !props.onUp}
            title={ui(lang, 'action.moveUp')}
          >{ui(lang, 'action.moveUp')}</button>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => props.onDown?.()}
            disabled={!canDown || !props.onDown}
            title={ui(lang, 'action.moveDown')}
          >{ui(lang, 'action.moveDown')}</button>
          <button
            type="button"
            className={css.iconBtn + ' ' + css.iconBtnDanger}
            onClick={props.onRemove}
            title={ui(lang, 'action.remove')}
          >{ui(lang, 'action.removeItem')}</button>
        </div>
      </div>
      {props.children}
    </div>
  );
}

/** Localized variant of `+ Add` button. Centralizes copy. */
export function AddButton(props: { onClick: () => void; label?: string }) {
  const lang = useLang();
  return (
    <button
      className="btn--xs"
      type="button"
      onClick={props.onClick}
    >{props.label ?? ui(lang, 'action.add')}</button>
  );
}

/** Move helpers shared across editors. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
