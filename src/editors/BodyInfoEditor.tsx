import css from './forms.module.css';
import { MLInput, ImageInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, InfoField } from '@/types/content';

const blankMLS = () => ({ vi: '', en: '', zh: '' });

export function BodyInfoEditor({ cat }: { cat: Category<'body-info'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const fields = d.fields ?? [];
  const imgs   = d.images ?? [];

  const setField  = (i: number, next: InfoField) => {
    const arr = [...fields]; arr[i] = next; patch(cat.id, { fields: arr });
  };
  const rmField   = (i: number) => patch(cat.id, { fields: fields.filter((_, j) => j !== i) });
  const moveField = (i: number, d2: number) => patch(cat.id, { fields: moveItem(fields, i, i + d2) });

  const rmImg   = (i: number) => patch(cat.id, { images: imgs.filter((_, j) => j !== i) });
  const moveImg = (i: number, d2: number) => patch(cat.id, { images: moveItem(imgs, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />

      <div className={css.label}>{ui(lang, 'card.fields')}</div>
      {fields.map((f, i) => (
        <ListItem
          key={i}
          index={i}
          total={fields.length}
          onUp={() => moveField(i, -1)}
          onDown={() => moveField(i, +1)}
          onRemove={() => rmField(i)}
        >
          <MLInput label={ui(lang, 'field.label')} value={f.label} onChange={v => setField(i, { ...f, label: v })} />
          <MLInput label={ui(lang, 'field.value')} value={f.value} onChange={v => setField(i, { ...f, value: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        fields: [...fields, { label: blankMLS(), value: blankMLS() }],
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
