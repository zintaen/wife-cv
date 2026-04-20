import { Page, SectionHead } from './Page';
import css from './ExperiencesTv.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseExperiencesTv: CategoryComponent<'experiences-tv'> = ({ data, lang }) => (
  <Page type="tv">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.tv}>
      <div className={css.grid}>
        {(data.images ?? []).slice(0, 4).map((src, i) => (
          <div key={i}><img src={src} alt="" /></div>
        ))}
      </div>
      <div className={css.copy}>
        {t(data.intro, lang) ? <p>{t(data.intro, lang)}</p> : null}
        <ul className={css.shows}>
          {(data.shows ?? []).map((s, i) => (
            <li key={i}>{t(s, lang)}</li>
          ))}
        </ul>
      </div>
    </div>
  </Page>
);
