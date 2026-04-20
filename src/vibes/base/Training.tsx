import { Page, SectionHead } from './Page';
import css from './Training.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseTraining: CategoryComponent<'training'> = ({ data, lang }) => (
  <Page type="training">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.training}>
      <div className={css.list}>
        {(data.programs ?? []).map((p, i) => (
          <div className={css.item} key={i}>
            <div className={css.num}>{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div className={css.title}>{t(p.title, lang)}</div>
              <div className={css.inst}>{t(p.institution, lang)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={css.photos}>
        {(data.images ?? []).slice(0, 2).map((src, i) => (
          <div key={i}><img src={src} alt="" /></div>
        ))}
      </div>
    </div>
  </Page>
);
