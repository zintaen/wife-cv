import css from './forms.module.css';
import { MLInput, TextInput } from './primitives';
import { useStore } from '@/store/useStore';
import type { Category, Play } from '@/types/content';

export function ExperiencesGalleryEditor({ cat }: { cat: Category<'experiences-gallery'> }) {
  const patch = useStore(s => s.patchCategory);
  const d = cat.data;
  const plays = d.plays ?? [];

  const setPlay = (i: number, next: Play) => {
    const arr = [...plays]; arr[i] = next; patch(cat.id, { plays: arr });
  };
  const rm = (i: number) => patch(cat.id, { plays: plays.filter((_, j) => j !== i) });

  return (
    <div className={css.group}>
      <MLInput label="Heading"    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label="Subheading" value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />
      <MLInput label="Intro"      value={d.intro} multiline onChange={v => patch(cat.id, { intro: v })} />

      {plays.map((p, i) => (
        <div key={i} className={css.card}>
          <div className={css.label}>Play {i + 1}</div>
          <MLInput label="Name"  value={p.name} onChange={v => setPlay(i, { ...p, name: v })} />
          <MLInput label="Role"  value={p.role} onChange={v => setPlay(i, { ...p, role: v })} />
          <TextInput label="Image" value={p.image ?? ''} onChange={v => setPlay(i, { ...p, image: v })} />
          <div className={css.btnRow}>
            <button className="btn--xs" onClick={() => rm(i)} type="button">Remove</button>
          </div>
        </div>
      ))}

      <button
        className="btn--xs" type="button"
        onClick={() => patch(cat.id, {
          plays: [...plays,
            { name: { vi: '', en: '', zh: '' }, role: { vi: '', en: '', zh: '' }, image: '' }],
        })}
      >+ Add play</button>
    </div>
  );
}
