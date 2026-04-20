import { Fragment } from 'react';
import { Page } from '../base/Page';
import css from './About.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const AboutWes: CategoryComponent<'about'> = ({ data, lang }) => {
  const sections = data.sections ?? [];
  return (
    <>
      {sections.map((s, i) => (
        <Page key={i} type="about">
          <Fragment>
            <div className={css.about}>
              <div className={css.eyebrow}>— {t(data.subheading, lang)} —</div>
              <h2 className={css.title}>{t(data.heading, lang)}</h2>
              <div className={css.triptych}>
                <div className={css.side}>chapter {String(i + 1).padStart(2, '0')}</div>
                <div className={css.frame}>
                  {s.image ? <img src={s.image} alt="" /> : null}
                </div>
                <div className={css.side}>of {String(sections.length).padStart(2, '0')}</div>
              </div>
              <div className={css.body}>{t(s.body, lang)}</div>
            </div>
          </Fragment>
        </Page>
      ))}
    </>
  );
};
