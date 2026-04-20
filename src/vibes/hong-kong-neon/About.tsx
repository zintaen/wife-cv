import { Fragment } from 'react';
import { Page } from '../base/Page';
import css from './About.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const AboutHongKong: CategoryComponent<'about'> = ({ data, lang }) => {
  const sections = data.sections ?? [];
  return (
    <>
      {sections.map((s, i) => {
        const parts = (t(data.heading, lang) || '').split(' ');
        const first = parts.shift() ?? '';
        const rest  = parts.join(' ');
        return (
          <Page key={i} type="about">
            <Fragment>
              <div className={css.about}>
                <div className={css.photo}>
                  {s.image ? <img src={s.image} alt="" /> : null}
                </div>
                <div className={css.spine}>作品</div>
                <div className={css.column}>
                  <div className={css.eyebrow}>{t(data.subheading, lang)}</div>
                  <h2 className={css.title}>
                    {first}{rest ? <> <em>{rest}</em></> : null}
                  </h2>
                  <div className={css.rule} />
                  <div className={css.body}>{t(s.body, lang)}</div>
                </div>
              </div>
            </Fragment>
          </Page>
        );
      })}
    </>
  );
};
