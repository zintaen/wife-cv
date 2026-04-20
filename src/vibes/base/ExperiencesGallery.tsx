import { Fragment } from 'react';
import { Page, SectionHead } from './Page';
import css from './ExperiencesGallery.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

const ROLE_LABEL: Record<string, string> = { vi: 'Vai:', en: 'Role:', zh: '角色:' };
const PER_PAGE = 8;

export const BaseExperiencesGallery: CategoryComponent<'experiences-gallery'> = ({ data, lang }) => {
  const plays = data.plays ?? [];
  const pages: { from: number; isFirst: boolean }[] = [];
  for (let i = 0; i < Math.max(plays.length, 1); i += PER_PAGE) {
    pages.push({ from: i, isFirst: i === 0 });
  }
  const roleLabel = ROLE_LABEL[lang] ?? ROLE_LABEL.en;
  return (
    <>
      {pages.map(({ from, isFirst }) => {
        const chunk = plays.slice(from, from + PER_PAGE);
        return (
          <Page key={from} type="theatre" title={t(data.heading, lang)}>
            <Fragment>
              <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
              <div className={css.gallery}>
                {isFirst && t(data.intro, lang)
                  ? <p className={css.intro}>{t(data.intro, lang)}</p>
                  : null}
                <div className={css.grid}>
                  {chunk.map((p, i) => (
                    <div className={css.card} key={i}>
                      <div className={css.img}>
                        {p.image ? <img src={p.image} alt="" /> : null}
                      </div>
                      <div className={css.cap}>
                        <div className={css.name}>{t(p.name, lang)}</div>
                        <div className={css.role}>{roleLabel} {t(p.role, lang)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Fragment>
          </Page>
        );
      })}
    </>
  );
};
