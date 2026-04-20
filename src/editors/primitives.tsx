import { useState } from 'react';
import css from './forms.module.css';
import type { Lang, MLStr } from '@/types/content';

const LANGS: Lang[] = ['vi', 'en', 'zh'];

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
