import { Page } from '../base/Page';
import css from './Cover.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const CoverShanghai: CategoryComponent<'cover'> = ({ data, lang }) => {
  const script = data.name?.vi ?? t(data.name, lang);      // script-calligraphy header uses Latin name
  const cjk    = data.name?.zh ?? '';                      // Chinese name sits below as quiet equal
  return (
    <Page type="cover">
      <div className={css.cover}>
        <div className={css.plate}>
          <div className={css.script}>{script}</div>
          {cjk ? <div className={css.cjk}>{cjk}</div> : null}
          <div className={css.portrait}>
            {data.image ? <img src={data.image} alt="" /> : null}
          </div>
          <div className={css.marquee}>{t(data.portfolio_label, lang)}</div>
          <div className={css.roles}>
            {(data.roles ?? []).map((r, i) => <span key={i}>{t(r, lang)}</span>)}
          </div>
        </div>
      </div>
    </Page>
  );
};
