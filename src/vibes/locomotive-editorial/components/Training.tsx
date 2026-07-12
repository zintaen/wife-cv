import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import { useReveal, useStaggeredReveal, Marquee, ShaderImage } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Training — credentials index. A lettered list of programs on the left with
 * staggered reveals, a two-pane image stack on the right, and a marquee ticker
 * of the institutions running across the top for editorial spine.
 */
export const LocoTraining: CategoryComponent<'training'> = ({ data, lang }) => {
  const listRef = useStaggeredReveal<HTMLOListElement>({ delayStep: 0.06 });
  const figARef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const figBRef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const progs   = data.programs ?? [];
  const images  = data.images ?? [];

  return (
    <Page type="training" className="loco-training">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />

      <Marquee duration={56} gap="3rem" className="loco-training__ticker">
        {progs.map((p, i) => (
          <span key={i} className="loco-training__ticker-item">
            <em>{String(i + 1).padStart(2, '0')}</em>
            {t(p.institution, lang) || t(p.title, lang)}
            <span className="loco-training__ticker-dot">•</span>
          </span>
        ))}
      </Marquee>

      <div className="loco-training__spread">
        <ol ref={listRef} className="loco-training__list">
          {progs.map((p, i) => (
            <li key={i} className="loco-training__item" data-reveal="up">
              <span className="loco-training__idx">{String(i + 1).padStart(2, '0')}</span>
              <div className="loco-training__copy">
                <h3 className="loco-training__title">{t(p.title, lang)}</h3>
                <div className="loco-training__inst">{t(p.institution, lang)}</div>
              </div>
              <span className="loco-training__rule" aria-hidden="true" />
            </li>
          ))}
        </ol>
        <div className="loco-training__figures">
          <div
            ref={figARef}
            className="loco-training__figure"
            data-reveal="mask"
            data-parallax="0.14"
          >
            {images[0]
              ? <ShaderImage src={images[0]} alt="" />
              : <div className="loco-training__placeholder" />}
          </div>
          <div
            ref={figBRef}
            className="loco-training__figure"
            data-reveal="mask"
            data-parallax="0.1"
          >
            {images[1]
              ? <ShaderImage src={images[1]} alt="" />
              : <div className="loco-training__placeholder" />}
          </div>
        </div>
      </div>
    </Page>
  );
};
