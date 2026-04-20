import { Page } from '../base/Page';
import css from './Cover.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const CoverWes: CategoryComponent<'cover'> = ({ data, lang }) => (
  <Page type="cover">
    <div className={css.cover}>
      <div className={css.label}>— {t(data.portfolio_label, lang)} —</div>
      <div className={css.rule} />
      <div className={css.frame}>
        {data.image ? <img src={data.image} alt="" /> : null}
      </div>
      <div className={css.name}>{t(data.name, lang)}</div>
      <div className={css.roles}>
        {(data.roles ?? []).map((r, i) => <span key={i}>{t(r, lang).toLowerCase()}</span>)}
      </div>
    </div>
  </Page>
);
