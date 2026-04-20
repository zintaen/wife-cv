import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, MLStr } from '@/types/content';

const blankMLS = (): MLStr => ({ vi: '', en: '', zh: '' });

export function ExperiencesTvEditor({ cat }: { cat: Category<'experiences-tv'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const shows = d.shows ?? [];
  const imgs  = d.images ?? [];

  const setShow = (i: number, next: MLStr) => {
    const arr = [...shows]; arr[i] = next; patch(cat.id, { shows: arr });
  };
  const rmShow   = (i: number) => patch(cat.id, { shows: shows.filter((_, j) => j !== i) });
  const moveShow = (i: number, d2: number) => patch(cat.id, { shows: moveItem(shows, i, i + d2) });

  const rmImg   = (i: number) => patch(cat.id, { images: imgs.filter((_, j) => j !== i) });
  const moveImg = (i: number, d2: number) => patch(cat.id, { images: moveItem(imgs, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />
      <MLInput label={ui(lang, 'field.intro')} multiline value={d.intro} onChange={v => patch(cat.id, { intro: v })} />

      <div className={css.label}>{ui(lang, 'card.shows')}</div>
      {shows.map((s, i) => (
        <ListItem
          key={i}
          index={i}
          total={shows.length}
          onUp={() => moveShow(i, -1)}
          onDown={() => moveShow(i, +1)}
          onRemove={() => rmShow(i)}
        >
          <MLInput label={ui(lang, 'field.showName')} value={s} onChange={v => setShow(i, v)} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, { shows: [...shows, blankMLS()] })} />

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
          <TextInput label={ui(lang, 'field.image')} value={src}
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
