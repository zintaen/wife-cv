import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category } from '@/types/content';

export function ThankYouEditor({ cat }: { cat: Category<'thankyou'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const imgs = d.images ?? [];

  const rmImg   = (i: number) => patch(cat.id, { images: imgs.filter((_, j) => j !== i) });
  const moveImg = (i: number, d2: number) => patch(cat.id, { images: moveItem(imgs, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}
               onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading}
               onChange={v => patch(cat.id, { subheading: v })} />

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
