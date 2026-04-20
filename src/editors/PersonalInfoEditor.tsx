import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, InfoField } from '@/types/content';

const blankMLS = () => ({ vi: '', en: '', zh: '' });

export function PersonalInfoEditor({ cat }: { cat: Category<'personal-info'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const fields = d.fields ?? [];

  const setField = (i: number, next: InfoField) => {
    const arr = [...fields]; arr[i] = next; patch(cat.id, { fields: arr });
  };
  const rm   = (i: number) => patch(cat.id, { fields: fields.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { fields: moveItem(fields, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput   label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput   label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />
      <TextInput label={ui(lang, 'field.image')}      value={d.image ?? ''} onChange={v => patch(cat.id, { image: v })} />

      <div className={css.label}>{ui(lang, 'card.fields')}</div>
      {fields.map((f, i) => (
        <ListItem
          key={i}
          index={i}
          total={fields.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <MLInput label={ui(lang, 'field.label')} value={f.label} onChange={v => setField(i, { ...f, label: v })} />
          <MLInput label={ui(lang, 'field.value')} value={f.value} onChange={v => setField(i, { ...f, value: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        fields: [...fields, { label: blankMLS(), value: blankMLS() }],
      })} />
    </div>
  );
}
