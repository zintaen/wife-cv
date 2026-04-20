import css from './forms.module.css';
import { MLInput, TextInput } from './primitives';
import { useStore } from '@/store/useStore';
import type { Category, TrainingProgram } from '@/types/content';

export function TrainingEditor({ cat }: { cat: Category<'training'> }) {
  const patch = useStore(s => s.patchCategory);
  const d = cat.data;
  const progs = d.programs ?? [];
  const imgs  = d.images ?? [];

  const setProg = (i: number, next: TrainingProgram) => {
    const arr = [...progs]; arr[i] = next; patch(cat.id, { programs: arr });
  };
  const rmProg = (i: number) => patch(cat.id, { programs: progs.filter((_, j) => j !== i) });

  return (
    <div className={css.group}>
      <MLInput label="Heading"    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label="Subheading" value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />

      {progs.map((p, i) => (
        <div key={i} className={css.card}>
          <div className={css.label}>Program {i + 1}</div>
          <MLInput label="Title"       value={p.title}        onChange={v => setProg(i, { ...p, title: v })} />
          <MLInput label="Institution" value={p.institution}  onChange={v => setProg(i, { ...p, institution: v })} />
          <div className={css.btnRow}>
            <button className="btn--xs" onClick={() => rmProg(i)} type="button">Remove</button>
          </div>
        </div>
      ))}
      <button
        className="btn--xs" type="button"
        onClick={() => patch(cat.id, {
          programs: [...progs, { title: { vi: '', en: '', zh: '' }, institution: { vi: '', en: '', zh: '' } }],
        })}
      >+ Add program</button>

      <div className={css.card}>
        <div className={css.label}>Images</div>
        {imgs.map((src, i) => (
          <TextInput key={i} label={`Image ${i + 1}`} value={src}
                     onChange={v => {
                       const arr = [...imgs]; arr[i] = v;
                       patch(cat.id, { images: arr });
                     }} />
        ))}
        <button className="btn--xs" type="button"
          onClick={() => patch(cat.id, { images: [...imgs, ''] })}>+ Add image</button>
      </div>
    </div>
  );
}
