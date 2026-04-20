import css from './forms.module.css';
import { MLInput, TextInput } from './primitives';
import { useStore } from '@/store/useStore';
import type { AboutSection, Category } from '@/types/content';

export function AboutEditor({ cat }: { cat: Category<'about'> }) {
  const patch = useStore(s => s.patchCategory);
  const d = cat.data;
  const sections = d.sections ?? [];

  const setSection = (i: number, next: AboutSection) => {
    const arr = [...sections]; arr[i] = next;
    patch(cat.id, { sections: arr });
  };
  const rm = (i: number) => patch(cat.id, { sections: sections.filter((_, j) => j !== i) });

  return (
    <div className={css.group}>
      <MLInput label="Heading"     value={d.heading}
               onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label="Subheading"  value={d.subheading}
               onChange={v => patch(cat.id, { subheading: v })} />

      {sections.map((s, i) => (
        <div key={i} className={css.card}>
          <div className={css.label}>Section {i + 1}</div>
          <MLInput label="Body" multiline value={s.body}
                   onChange={v => setSection(i, { ...s, body: v })} />
          <TextInput label="Image" value={s.image ?? ''}
                     onChange={v => setSection(i, { ...s, image: v })} />
          <div className={css.btnRow}>
            <button className="btn--xs" onClick={() => rm(i)} type="button">Remove</button>
          </div>
        </div>
      ))}
      <button
        className="btn--xs" type="button"
        onClick={() => patch(cat.id, {
          sections: [...sections, { body: { vi: '', en: '', zh: '' }, image: '' }],
        })}
      >+ Add section</button>
    </div>
  );
}
