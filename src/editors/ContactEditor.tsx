import css from './forms.module.css';
import { MLInput, TextInput, Field, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, ContactEntry, ContactIconKey } from '@/types/content';

const blankMLS = () => ({ vi: '', en: '', zh: '' });

const ICON_OPTIONS: ContactIconKey[] = [
  'phone', 'email', 'facebook', 'tiktok', 'instagram', 'youtube',
];

export function ContactEditor({ cat }: { cat: Category<'contact'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const entries = d.entries ?? [];

  const setEntry = (i: number, next: ContactEntry) => {
    const arr = [...entries]; arr[i] = next; patch(cat.id, { entries: arr });
  };
  const rm   = (i: number) => patch(cat.id, { entries: entries.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { entries: moveItem(entries, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput   label={ui(lang, 'field.heading')}    value={d.heading}     onChange={v => patch(cat.id, { heading: v })} />
      <MLInput   label={ui(lang, 'field.subheading')} value={d.subheading}  onChange={v => patch(cat.id, { subheading: v })} />
      <TextInput label={ui(lang, 'field.image')}      value={d.image ?? ''} onChange={v => patch(cat.id, { image: v })} />

      <div className={css.label}>{ui(lang, 'card.entries')}</div>
      {entries.map((e, i) => (
        <ListItem
          key={i}
          index={i}
          total={entries.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <Field label={ui(lang, 'field.iconType')}>
            <select
              className={css.input}
              value={e.icon ?? 'phone'}
              onChange={ev => setEntry(i, { ...e, icon: ev.target.value as ContactIconKey })}
            >
              {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <MLInput   label={ui(lang, 'field.label')}    value={e.label}       onChange={v => setEntry(i, { ...e, label: v })} />
          <MLInput   label={ui(lang, 'field.value')}    value={e.value}       onChange={v => setEntry(i, { ...e, value: v })} />
          <TextInput label={ui(lang, 'field.linkHref')} value={e.href ?? ''}  onChange={v => setEntry(i, { ...e, href: v })} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        entries: [...entries, { icon: 'phone', label: blankMLS(), value: blankMLS(), href: '' }],
      })} />
    </div>
  );
}
