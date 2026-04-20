import css from './forms.module.css';
import { MLInput, TextInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, MediaMention } from '@/types/content';

const blankMLS = () => ({ vi: '', en: '', zh: '' });

export function MediaEditor({ cat }: { cat: Category<'media'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const mentions = d.mentions ?? [];

  const setMention = (i: number, next: MediaMention) => {
    const arr = [...mentions]; arr[i] = next; patch(cat.id, { mentions: arr });
  };
  const rmMention   = (i: number) => patch(cat.id, { mentions: mentions.filter((_, j) => j !== i) });
  const moveMention = (i: number, d2: number) => patch(cat.id, { mentions: moveItem(mentions, i, i + d2) });

  const setLink = (mi: number, li: number, value: string) => {
    const arr = [...mentions];
    const links = [...(arr[mi].links ?? [])];
    links[li] = value;
    arr[mi] = { ...arr[mi], links };
    patch(cat.id, { mentions: arr });
  };
  const rmLink = (mi: number, li: number) => {
    const arr = [...mentions];
    arr[mi] = { ...arr[mi], links: (arr[mi].links ?? []).filter((_, j) => j !== li) };
    patch(cat.id, { mentions: arr });
  };
  const moveLink = (mi: number, li: number, d2: number) => {
    const arr = [...mentions];
    arr[mi] = { ...arr[mi], links: moveItem(arr[mi].links ?? [], li, li + d2) };
    patch(cat.id, { mentions: arr });
  };
  const addLink = (mi: number) => {
    const arr = [...mentions];
    arr[mi] = { ...arr[mi], links: [...(arr[mi].links ?? []), ''] };
    patch(cat.id, { mentions: arr });
  };

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />

      <div className={css.label}>{ui(lang, 'card.mentions')}</div>
      {mentions.map((m, i) => (
        <ListItem
          key={i}
          index={i}
          total={mentions.length}
          onUp={() => moveMention(i, -1)}
          onDown={() => moveMention(i, +1)}
          onRemove={() => rmMention(i)}
        >
          <MLInput   label={ui(lang, 'field.play')}   value={m.play}         onChange={v => setMention(i, { ...m, play: v })} />
          <TextInput label={ui(lang, 'field.poster')} value={m.poster ?? ''} onChange={v => setMention(i, { ...m, poster: v })} />

          <div className={css.label}>{ui(lang, 'card.links')}</div>
          {(m.links ?? []).map((href, li) => (
            <ListItem
              key={li}
              index={li}
              total={(m.links ?? []).length}
              onUp={() => moveLink(i, li, -1)}
              onDown={() => moveLink(i, li, +1)}
              onRemove={() => rmLink(i, li)}
            >
              <TextInput label={ui(lang, 'field.linkHref')} value={href}
                         onChange={v => setLink(i, li, v)} />
            </ListItem>
          ))}
          <AddButton onClick={() => addLink(i)} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        mentions: [...mentions, { play: blankMLS(), poster: '', links: [] }],
      })} />
    </div>
  );
}
