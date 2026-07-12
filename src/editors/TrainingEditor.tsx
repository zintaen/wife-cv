import css from './forms.module.css';
import { MLInput, ImageInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, TrainingProgram } from '@/types/content';

export function TrainingEditor({ cat }: { cat: Category<'training'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const progs = d.programs ?? [];
  const imgs  = d.images ?? [];

  const setProg  = (i: number, next: TrainingProgram) => {
    const arr = [...progs]; arr[i] = next; patch(cat.id, { programs: arr });
  };
  const rmProg   = (i: number) => patch(cat.id, { programs: progs.filter((_, j) => j !== i) });
  const moveProg = (i: number, d2: number) => patch(cat.id, { programs: moveItem(progs, i, i + d2) });

  const rmImg   = (i: number) => patch(cat.id, { images: imgs.filter((_, j) => j !== i) });
  const moveImg = (i: number, d2: number) => patch(cat.id, { images: moveItem(imgs, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />

      <div className={css.label}>{ui(lang, 'card.programs')}</div>
      {progs.map((p, i) => (
        <ListItem
          key={i}
          index={i}
          total={progs.length}
          onUp={() => moveProg(i, -1)}
          onDown={() => moveProg(i, +1)}
          onRemove={() => rmProg(i)}
        >
          <MLInput label={ui(lang, 'field.title')}       value={p.title}       onChange={v => setProg(i, { ...p, title: v })} />
          <MLInput label={ui(lang, 'field.institution')} value={p.institution} onChange={v => setProg(i, { ...p, institution: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        programs: [...progs, { title: { vi: '', en: '', zh: '' }, institution: { vi: '', en: '', zh: '' } }],
      })} />

      <div className={css.label}>{ui(lang, 'card.photos')}</div>
      {imgs.map((src, i) => (
        <ListItem
          key={i}
          index={i}
          total={imgs.length}
          onUp={() => moveImg(i, -1)}
          onDown={() => moveImg(i, +1)}
          onRemove={() => rmImg(i)}
        >
          <ImageInput label={ui(lang, 'field.image')} value={src}
                      onChange={v => {
                        const arr = [...imgs]; arr[i] = v;
                        patch(cat.id, { images: arr });
                      }} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, { images: [...imgs, ''] })} />
    </div>
  );
}
