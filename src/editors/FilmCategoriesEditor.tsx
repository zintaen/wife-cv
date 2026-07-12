import css from './forms.module.css';
import { MLInput, TextInput, ImageInput, ListItem, AddButton, moveItem } from './primitives';
import { useStore } from '@/store/useStore';
import { ui } from '@/i18n/strings';
import type { Category, FilmCategory, MLStr } from '@/types/content';

const blankMLS = (): MLStr => ({ vi: '', en: '', zh: '' });

export function FilmCategoriesEditor({ cat }: { cat: Category<'film-categories'> }) {
  const patch = useStore(s => s.patchCategory);
  const lang  = useStore(s => s.lang);
  const d = cat.data;
  const cats = d.categories ?? [];
  const imgs = d.images ?? [];

  const setCat  = (i: number, next: FilmCategory) => {
    const arr = [...cats]; arr[i] = next; patch(cat.id, { categories: arr });
  };
  const rmCat   = (i: number) => patch(cat.id, { categories: cats.filter((_, j) => j !== i) });
  const moveCat = (i: number, d2: number) => patch(cat.id, { categories: moveItem(cats, i, i + d2) });

  const setWork = (ci: number, wi: number, next: MLStr) => {
    const arr = [...cats];
    const works = [...(arr[ci].works ?? [])];
    works[wi] = next;
    arr[ci] = { ...arr[ci], works };
    patch(cat.id, { categories: arr });
  };
  const rmWork = (ci: number, wi: number) => {
    const arr = [...cats];
    arr[ci] = { ...arr[ci], works: (arr[ci].works ?? []).filter((_, j) => j !== wi) };
    patch(cat.id, { categories: arr });
  };
  const moveWork = (ci: number, wi: number, d2: number) => {
    const arr = [...cats];
    arr[ci] = { ...arr[ci], works: moveItem(arr[ci].works ?? [], wi, wi + d2) };
    patch(cat.id, { categories: arr });
  };
  const addWork = (ci: number) => {
    const arr = [...cats];
    arr[ci] = { ...arr[ci], works: [...(arr[ci].works ?? []), blankMLS()] };
    patch(cat.id, { categories: arr });
  };

  const rmImg   = (i: number) => patch(cat.id, { images: imgs.filter((_, j) => j !== i) });
  const moveImg = (i: number, d2: number) => patch(cat.id, { images: moveItem(imgs, i, i + d2) });

  return (
    <div className={css.group}>
      <MLInput label={ui(lang, 'field.heading')}    value={d.heading}    onChange={v => patch(cat.id, { heading: v })} />
      <MLInput label={ui(lang, 'field.subheading')} value={d.subheading} onChange={v => patch(cat.id, { subheading: v })} />

      <div className={css.label}>{ui(lang, 'card.categories')}</div>
      {cats.map((c, i) => (
        <ListItem
          key={i}
          index={i}
          total={cats.length}
          onUp={() => moveCat(i, -1)}
          onDown={() => moveCat(i, +1)}
          onRemove={() => rmCat(i)}
        >
          <TextInput label={ui(lang, 'field.iconEmoji')}    value={c.icon ?? ''} onChange={v => setCat(i, { ...c, icon: v })} />
          <MLInput   label={ui(lang, 'field.categoryTitle')} value={c.title}     onChange={v => setCat(i, { ...c, title: v })} />

          <div className={css.label}>{ui(lang, 'card.works')}</div>
          {(c.works ?? []).map((w, wi) => (
            <ListItem
              key={wi}
              index={wi}
              total={(c.works ?? []).length}
              onUp={() => moveWork(i, wi, -1)}
              onDown={() => moveWork(i, wi, +1)}
              onRemove={() => rmWork(i, wi)}
            >
              <MLInput label={ui(lang, 'field.work')} value={w} onChange={v => setWork(i, wi, v)} />
            </ListItem>
          ))}
          <AddButton onClick={() => addWork(i)} />
        </ListItem>
      ))}
      <AddButton onClick={() => patch(cat.id, {
        categories: [...cats, { icon: '', title: blankMLS(), works: [] }],
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
