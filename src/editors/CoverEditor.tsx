import css from './forms.module.css';
import { MLInput, TextInput } from './primitives';
import { useStore } from '@/store/useStore';
import type { Category, MLStr } from '@/types/content';

export function CoverEditor({ cat }: { cat: Category<'cover'> }) {
  const patch = useStore(s => s.patchCategory);
  const d = cat.data;
  return (
    <div className={css.group}>
      <MLInput label="Portfolio label" value={d.portfolio_label}
               onChange={v => patch(cat.id, { portfolio_label: v })} />
      <MLInput label="Name"            value={d.name}
               onChange={v => patch(cat.id, { name: v })} />
      <div className={css.card}>
        <div className={css.label}>Roles</div>
        {(d.roles ?? []).map((r, i) => (
          <MLInput key={i} label={`Role ${i + 1}`} value={r}
                   onChange={v => {
                     const next = [...(d.roles ?? [])]; next[i] = v;
                     patch(cat.id, { roles: next });
                   }} />
        ))}
        <button className="btn--xs" type="button"
          onClick={() => patch(cat.id, { roles: [...(d.roles ?? []), { vi: '', en: '', zh: '' } as MLStr] })}
        >+ Add role</button>
      </div>
      <TextInput label="Image path" value={d.image ?? ''}
                 onChange={v => patch(cat.id, { image: v })}
                 placeholder="images/cover-01.jpeg" />
    </div>
  );
}
