import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { AboutSection, Category } from '@/types/content';

export function AboutEditor({ cat }: { cat: Category<'about'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const sections = d.sections ?? [];

  const setSection = (i: number, next: AboutSection) => {
    const arr = [...sections]; arr[i] = next;
    patch(cat.id, { sections: arr });
  };
  const rm   = (i: number) => patch(cat.id, { sections: sections.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { sections: moveItem(sections, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}
               onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading}
               onChange={v => patch(cat.id, { subheading: v })} />

      <div className={css.label}>{ui(lang, 'card.sections')}</div>
      {sections.map((s, i) => (
        <ListItem
          key={i}
          index={i}
          total={sections.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <MLInput label={ui(lang, 'field.body')} multiline value={s.body}
                   onChange={v => setSection(i, { ...s, body: v })} />
          <TextInput label={ui(lang, 'field.image')} value={s.image ?? ''}
                     onChange={v => setSection(i, { ...s, image: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        sections: [...sections, { body: { vi: '', en: '', zh: '' }, image: '' }],
      })} />
    </div>
  );
}
