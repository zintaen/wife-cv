import { Page, SectionHead } from './Page';
import css from './Abilities.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseAbilities: CategoryComponent<'abilities'> = ({ data, lang }) => (
  <Page type="abilities">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.abilities}>
      <div className={css.photo}>
        {data.image ? <img src={data.image} alt="" /> : null}
      </div>
      <div className={css.grid}>
        {(data.skills ?? []).map((s, i) => (
          <div key={i} className={css.skill}>
            <div className={css.ring} style={{ ['--pct' as never]: s.percent }}>
              <div className={css.pct}>{s.percent}%</div>
            </div>
            <div className={css.name}>{t(s.name, lang)}</div>
          </div>
        ))}
      </div>
    </div>
  </Page>
);
