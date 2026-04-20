// Fallback editor: raw JSON for category types we haven't built a dedicated
// form for yet (personal-info, body-info, abilities, experiences-tv,
// film-categories, media, contact, thankyou). Still validates the JSON
// before committing and surfaces parse errors inline.
import { useEffect, useState } from 'react';
import css from './forms.module.css';
import { useStore } from '@/store/useStore';
import type { Category } from '@/types/content';

export function JsonEditor({ cat }: { cat: Category }) {
  const replace = useStore(s => s.replaceCategory);
  const [text, setText] = useState(() => JSON.stringify(cat.data, null, 2));
  const [err, setErr]   = useState<string | null>(null);

  // When the selected category changes, refresh the buffer.
  useEffect(() => { setText(JSON.stringify(cat.data, null, 2)); setErr(null); }, [cat.id]);

  const commit = () => {
    try {
      const parsed = JSON.parse(text);
      replace(cat.id, { ...cat, data: parsed });
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className={css.group}>
      <div className={css.label}>Raw JSON — type "{cat.type}"</div>
      <textarea
        className={css.area + ' ' + css.jsonArea}
        style={{ minHeight: 320 }}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      {err ? <div style={{ color: '#E08A6A', fontSize: 11 }}>{err}</div> : null}
      <div className={css.btnRow}>
        <button className="btn--xs" type="button" onClick={commit}>Apply</button>
        <button className="btn--xs" type="button" onClick={() => { setText(JSON.stringify(cat.data, null, 2)); setErr(null); }}>
          Revert
        </button>
      </div>
    </div>
  );
}
