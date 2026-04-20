import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, Play } from '@/types/content';

export function ExperiencesGalleryEditor({ cat }: { cat: Category<'experiences-gallery'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const plays = d.plays ?? [];

  const setPlay  = (i: number, next: Play) => {
    const arr = [...plays]; arr[i] = next; patch(cat.id, { plays: arr });
  };
  const rm   = (i: number) => patch(cat.id, { plays: plays.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { plays: moveItem(plays, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />
      <MLInput label={ui(lang, 'field.intro')} multiline value={d.intro} onChange={v => patch(cat.id, { intro: v })} />

      <div className={css.label}>{ui(lang, 'card.plays')}</div>
      {plays.map((p, i) => (
        <ListItem
          key={i}
          index={i}
          total={plays.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <MLInput   label={ui(lang, 'field.playName')} value={p.name}       onChange={v => setPlay(i, { ...p, name: v })} />
          <MLInput   label={ui(lang, 'field.role')}     value={p.role}       onChange={v => setPlay(i, { ...p, role: v })} />
          <TextInput label={ui(lang, 'field.image')}    value={p.image ?? ''} onChange={v => setPlay(i, { ...p, image: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        plays: [...plays,
          { name: { vi: '', en: '', zh: '' }, role: { vi: '', en: '', zh: '' }, image: '' }],
      })} />
    </div>
  );
}
