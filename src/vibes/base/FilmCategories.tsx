import { Page, SectionHead } from './Page';
import css from './FilmCategories.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseFilmCategories: CategoryComponent<'film-categories'> = ({ data, lang }) => (
  <Page type="film">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.film}>
      <div className={css.gallery}>
        {(data.images ?? []).slice(0, 9).map((src, i) => (
          <div key={i}><img src={src} alt="" /></div>
        ))}
      </div>
      <div className={css.cats}>
        {(data.categories ?? []).map((c, i) => (
          <div className={css.cat} key={i}>
            <div className={css.icon}>{c.icon}</div>
            <div>
              <div className={css.ctitle}>{t(c.title, lang)}</div>
              <div className={css.works}>
                {(c.works ?? []).map(w => t(w, lang)).join(' · ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Page>
);
