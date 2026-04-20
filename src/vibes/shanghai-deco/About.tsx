import { Fragment } from 'react';
import { Page } from '../base/Page';
import css from './About.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const AboutShanghai: CategoryComponent<'about'> = ({ data, lang }) => {
  const sections = data.sections ?? [];
  return (
    <>
      {sections.map((s, i) => (
        <Page key={i} type="about">
          <Fragment>
            <div className={css.about}>
              <div className={css.eyebrow}>{t(data.subheading, lang)}</div>
              <h2 className={css.title}>{t(data.heading, lang)}</h2>
              <div className={css.card}>
                <div className={css.body}>{t(s.body, lang)}</div>
                <div className={css.photo}>
                  {s.image ? <img src={s.image} alt="" /> : null}
                  <div className={css.seal}>印</div>
                </div>
              </div>
            </div>
          </Fragment>
        </Page>
      ))}
    </>
  );
};
