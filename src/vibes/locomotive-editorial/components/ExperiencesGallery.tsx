import { Fragment } from 'react';
import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  HorizontalRail, TheaterMode, useReveal, useSplitText, ShaderImage, Marquee,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';

const ROLE_LABEL: Record<string, string> = { vi: 'Vai', en: 'Role', zh: '角色' };
const PER_PAGE = 12;  // more plays per page — horizontal rail absorbs them

/**
 * Theatre — the signature pinned horizontal rail. On screen, each page
 * dedicates itself to one horizontal filmstrip that scrolls left-to-right as
 * the user scrolls down. Clicking a play opens it in theater mode with
 * curtain-reveal animations. Touch devices get a native swipe rail.
 *
 * On print, the theme.css @media print rules collapse the rail into a
 * conventional A4 grid so the PDF stays presentable.
 */
export const LocoExperiencesGallery: CategoryComponent<'experiences-gallery'> = ({ data, lang }) => {
  const plays  = data.plays ?? [];
  const pages: { from: number; isFirst: boolean; isLast: boolean }[] = [];
  for (let i = 0; i < Math.max(plays.length, 1); i += PER_PAGE) {
    pages.push({
      from: i,
      isFirst: i === 0,
      isLast:  i + PER_PAGE >= plays.length,
    });
  }
  const roleLabel = ROLE_LABEL[lang] ?? ROLE_LABEL.en;
  const heading   = t(data.heading, lang);
  const sub       = t(data.subheading, lang);
  const intro     = t(data.intro, lang);

  return (
    <>
      {pages.map(({ from, isFirst }, pageIdx) => {
        const chunk = plays.slice(from, from + PER_PAGE);
        return (
          <Page
            key={from}
            type="theatre"
            title={heading}
            className="loco-theatre"
          >
            <Fragment>
              {isFirst ? (
                <TheatreHeader
                  heading={heading}
                  sub={sub}
                  intro={intro}
                  total={plays.length}
                />
              ) : (
                <SectionHead
                  eyebrow={`${sub} — cont. ${String(pageIdx + 1).padStart(2, '0')}`}
                  title={heading}
                />
              )}
              <TheaterMode>
                <HorizontalRail ratio={1}>
                  <TheatreStrip chunk={chunk} roleLabel={roleLabel} offset={from} lang={lang} />
                </HorizontalRail>
              </TheaterMode>
            </Fragment>
          </Page>
        );
      })}
    </>
  );
};

function TheatreHeader(props: { heading: string; sub: string; intro: string; total: number }) {
  const introRef = useSplitText<HTMLParagraphElement>({ threshold: 0.2 });
  const metaRef  = useReveal<HTMLDivElement>({ threshold: 0.25 });
  return (
    <>
      <SectionHead eyebrow={props.sub} title={props.heading} />
      <div className="loco-theatre__prelude">
        {props.intro ? (
          <p ref={introRef} className="loco-theatre__intro">
            {props.intro}
          </p>
        ) : null}
        <div
          ref={metaRef}
          className="loco-theatre__meta"
          data-reveal="up"
        >
          <span>Index</span>
          <span className="loco-theatre__meta-num">{String(props.total).padStart(2, '0')}</span>
          <span className="loco-theatre__meta-rule" />
          <span>plays · stage &amp; studio</span>
        </div>
      </div>
      <Marquee duration={64} gap="4rem" className="loco-theatre__marquee" reverse>
        <span>Stage</span>
        <span className="loco-theatre__marquee-em">·</span>
        <span>Scene</span>
        <span className="loco-theatre__marquee-em">·</span>
        <span><em>Repertoire</em></span>
        <span className="loco-theatre__marquee-em">·</span>
        <span>Performance</span>
        <span className="loco-theatre__marquee-em">·</span>
        <span>Curtain</span>
        <span className="loco-theatre__marquee-em">·</span>
      </Marquee>
    </>
  );
}

function TheatreStrip(props: {
  chunk: { name: { vi: string; en: string; zh: string }; role: { vi: string; en: string; zh: string }; image: string }[];
  roleLabel: string;
  offset: number;
  lang: 'vi' | 'en' | 'zh';
}) {
  return (
    <div className="loco-theatre__strip">
      {props.chunk.map((p, i) => (
        <TheatreCard
          key={i}
          index={props.offset + i}
          name={t(p.name, props.lang)}
          role={t(p.role, props.lang)}
          roleLabel={props.roleLabel}
          image={p.image}
        />
      ))}
    </div>
  );
}

function TheatreCard(props: {
  index: number;
  name: string;
  role: string;
  roleLabel: string;
  image: string;
}) {
  const ref = useReveal<HTMLDivElement>({ threshold: 0.12 });
  return (
    <figure
      ref={ref}
      className="loco-theatre__card"
      data-reveal="up"
      data-theater-src={props.image || undefined}
      data-cursor="view"
      data-cursor-label="View"
      data-thumb={props.image || undefined}
    >
      <div className="loco-theatre__card-inner">
        <div className="loco-theatre__card-num">
          {String(props.index + 1).padStart(2, '0')}
        </div>
        <div className="loco-theatre__card-img">
          {props.image
            ? <ShaderImage src={props.image} alt={props.name} />
            : <div className="loco-theatre__placeholder" />}
        </div>
        <figcaption className="loco-theatre__card-cap">
          <div className="loco-theatre__card-name">{props.name}</div>
          <div className="loco-theatre__card-role">
            <span>{props.roleLabel}</span>
            <em>{props.role}</em>
          </div>
        </figcaption>
      </div>
    </figure>
  );
}
