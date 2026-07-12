import { Fragment } from 'react';
import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import { useReveal, useSplitText, ShaderImage } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * About — editorial spread. Large serif heading, drop-cap paragraph, shader
 * portrait on the facing page. Each section becomes its own page (matches
 * base behavior) but with split-text reveal + parallax figure.
 */
export const LocoAbout: CategoryComponent<'about'> = ({ data, lang }) => {
  const sections = data.sections ?? [];
  return (
    <>
      {sections.map((s, i) => (
        <AboutSpread
          key={i}
          index={i}
          heading={t(data.heading, lang)}
          sub={t(data.subheading, lang)}
          body={t(s.body, lang)}
          image={s.image}
        />
      ))}
    </>
  );
};

function AboutSpread(props: {
  index: number;
  heading: string;
  sub: string;
  body: string;
  image: string;
}) {
  const bodyRef  = useSplitText<HTMLParagraphElement>({ threshold: 0.15 });
  const figRef   = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const markRef  = useReveal<HTMLDivElement>({ threshold: 0.25 });
  const first = props.body.trim().charAt(0);
  const rest  = props.body.trim().slice(1);

  return (
    <Page type="about" title={props.heading} className="loco-about">
      <Fragment>
        <SectionHead eyebrow={props.sub} title={props.heading} />
        <div className="loco-about__spread">
          <article className="loco-about__text">
            <div
              ref={markRef}
              className="loco-about__mark"
              data-reveal="up"
            >
              <span>Chapter</span>
              <span className="loco-about__mark-num">{String(props.index + 1).padStart(2, '0')}</span>
            </div>
            <p ref={bodyRef} className="loco-about__body">
              {first ? <span className="loco-about__drop">{first}</span> : null}
              {rest}
            </p>
            <div className="loco-about__sign">
              — <em>an index of presence, screen &amp; stage</em>
            </div>
          </article>
          <aside
            ref={figRef}
            className="loco-about__figure"
            data-reveal="mask"
            data-parallax="0.14"
          >
            {props.image
              ? <ShaderImage src={props.image} alt="" />
              : <div className="loco-about__placeholder" />}
            <figcaption className="loco-about__cap">
              <span>Fig. {String(props.index + 1).padStart(2, '0')}</span>
              <span>Portrait · studio</span>
            </figcaption>
          </aside>
        </div>
      </Fragment>
    </Page>
  );
}
