import { Page } from '../base/Page';
import css from './Cover.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const CoverHongKong: CategoryComponent<'cover'> = ({ data, lang }) => {
  // Vertical CJK masthead pulls from the name's Chinese variant; Latin name
  // reads horizontally at the page foot. Content arrangement inverts the base.
  const nameZh = data.name?.zh ?? '';
  return (
    <Page type="cover">
      <div className={css.cover}>
        <div className={css.portrait}>
          {data.image ? <img src={data.image} alt="" /> : null}
        </div>
        <div className={css.label}>{t(data.portfolio_label, lang)}</div>
        {nameZh ? <div className={css.neon}>{nameZh}</div> : null}
        <div className={css.name}>{t(data.name, lang)}</div>
        <div className={css.roles}>
          {(data.roles ?? []).map((r, i) => <span key={i}>{t(r, lang)}</span>)}
        </div>
      </div>
    </Page>
  );
};
