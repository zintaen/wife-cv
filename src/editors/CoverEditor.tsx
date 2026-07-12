import css from './forms.module.css';
import { MLInput, ImageInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, MLStr } from '@/types/content';

const blankMLS = (): MLStr => ({ vi: '', en: '', zh: '' });

export function CoverEditor({ cat }: { cat: Category<'cover'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const roles = d.roles ?? [];

  const setRole = (i: number, v: MLStr) => {
    const next = [...roles]; next[i] = v; patch(cat.id, { roles: next });
  };
  const rm   = (i: number) => patch(cat.id, { roles: roles.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { roles: moveItem(roles, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput   label="Portfolio label" value={d.portfolio_label}
                 onChange={v => patch(cat.id, { portfolio_label: v })} />
      <MLInput   label={ui(lang, 'field.name')} value={d.name}
                 onChange={v => patch(cat.id, { name: v })} />
      <ImageInput label={ui(lang, 'field.image')} value={d.image ?? ''}
                  onChange={v => patch(cat.id, { image: v })}
                  placeholder="images/cover-01.jpeg" />

      <div className={css.label}>Roles</div>
      {roles.map((r, i) => (
        <ListItem
          key={i}
          index={i}
          total={roles.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <MLInput label={ui(lang, 'field.role')} value={r}
                   onChange={v => setRole(i, v)} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, { roles: [...roles, blankMLS()] })} />
    </div>
  );
}
