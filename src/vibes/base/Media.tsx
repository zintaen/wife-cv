import { Page, SectionHead } from './Page';
import css from './Media.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

const stripScheme = (u: string) => u.replace(/^https?:\/\//, '');

export const BaseMedia: CategoryComponent<'media'> = ({ data, lang }) => (
  <Page type="media">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.grid}>
      {(data.mentions ?? []).map((m, i) => (
        <div className={css.card} key={i}>
          <div className={css.poster}>
            {m.poster ? <img src={m.poster} alt="" /> : null}
          </div>
          <div className={css.play}>{t(m.play, lang)}</div>
          <div className={css.links}>
            {(m.links ?? []).map((l, j) => (
              <a key={j} className={css.link} href={l} target="_blank" rel="noopener">
                {stripScheme(l)}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Page>
);
