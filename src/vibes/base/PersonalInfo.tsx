import { Page, SectionHead } from './Page';
import css from './Info.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BasePersonalInfo: CategoryComponent<'personal-info'> = ({ data, lang }) => (
  <Page type="personal">
    <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
    <div className={css.info}>
      <div className={css.photo}>
        {data.image ? <img src={data.image} alt="" /> : null}
      </div>
      <div className={css.fields}>
        {(data.fields ?? []).map((f, i) => (
          <div className={css.row} key={i}>
            <div className={css.label}>{t(f.label, lang)}</div>
            <div className={css.value}>{t(f.value, lang)}</div>
          </div>
        ))}
      </div>
    </div>
  </Page>
);
