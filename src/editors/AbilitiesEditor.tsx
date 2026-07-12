import css from './forms.module.css';
import { MLInput, ImageInput, Field, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, Skill } from '@/types/content';

const blankMLS = () => ({ vi: '', en: '', zh: '' });

export function AbilitiesEditor({ cat }: { cat: Category<'abilities'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const skills = d.skills ?? [];

  const setSkill = (i: number, next: Skill) => {
    const arr = [...skills]; arr[i] = next; patch(cat.id, { skills: arr });
  };
  const rm   = (i: number) => patch(cat.id, { skills: skills.filter((_, j) => j !== i) });
  const move = (i: number, d2: number) => patch(cat.id, { skills: moveItem(skills, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput   label={ui(lang, 'field.heading')}    value={d.heading}     onChange={v => patch(cat.id, { heading: v })} />
      <MLInput   label={ui(lang, 'field.subheading')} value={d.subheading}  onChange={v => patch(cat.id, { subheading: v })} />
      <ImageInput label={ui(lang, 'field.image')}     value={d.image ?? ''} onChange={v => patch(cat.id, { image: v })} />

      <div className={css.label}>{ui(lang, 'card.skills')}</div>
      {skills.map((s, i) => (
        <ListItem
          key={i}
          index={i}
          total={skills.length}
          onUp={() => move(i, -1)}
          onDown={() => move(i, +1)}
          onRemove={() => rm(i)}
        >
          <MLInput label={ui(lang, 'field.skillName')} value={s.name} onChange={v => setSkill(i, { ...s, name: v })} />
          <Field label={ui(lang, 'field.percent')}>
            <input
              className={css.input}
              type="number"
              min={0}
              max={100}
              value={Number.isFinite(s.percent) ? s.percent : 0}
              onChange={e => setSkill(i, { ...s, percent: Number(e.target.value) || 0 })}
            />
          </Field>
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        skills: [...skills, { name: blankMLS(), percent: 50 }],
      })} />
    </div>
  );
}
