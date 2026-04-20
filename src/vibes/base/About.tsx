import { Fragment } from 'react';
import { Page, SectionHead } from './Page';
import css from './About.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseAbout: CategoryComponent<'about'> = ({ data, lang }) => {
  const sections = data.sections ?? [];
  return (
    <>
      {sections.map((s, i) => {
        const body = t(s.body, lang).trim();
        const first = body.charAt(0);
        const rest  = body.slice(1);
        return (
          <Page key={i} type="about" title={t(data.heading, lang)}>
            <Fragment>
              <SectionHead
                eyebrow={t(data.subheading, lang)}
                title={t(data.heading, lang)}
              />
              <div className={css.about}>
                <div className={css.text}>
                  <p>
                    {first ? <span className={css.drop}>{first}</span> : null}
                    {rest}
                  </p>
                </div>
                <div className={css.photo}>
                  {s.image
                    ? <img src={s.image} alt="" />
                    : <div className={css.placeholder} />}
                </div>
              </div>
            </Fragment>
          </Page>
        );
      })}
    </>
  );
};
