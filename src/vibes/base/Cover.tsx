import { Page } from './Page';
import css from './Cover.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseCover: CategoryComponent<'cover'> = ({ data, lang }) => (
  <Page type="cover" className={css.pageCover}>
    <div className={css.cover}>
      <div className={css.left}>
        <div className={css.frame}>{t(data.portfolio_label, lang)}</div>
        <div className={css.stageName}>{t(data.name, lang)}</div>
        <div className={css.roles}>
          {(data.roles ?? []).map((r, i) => (
            <span key={i}>{t(r, lang)}</span>
          ))}
        </div>
      </div>
      <div className={css.right}>
        {data.image
          ? <img className={css.img} src={data.image} alt="" />
          : <div className={css.placeholder} />}
      </div>
    </div>
  </Page>
);
