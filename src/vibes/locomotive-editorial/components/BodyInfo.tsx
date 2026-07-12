import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import { useReveal, useStaggeredReveal, ShaderImage } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Body info — the "measurements" dossier. Two shader figures stacked in a
 * split column on the left, metrics column on the right with tabular numerals
 * and staggered reveals.
 */
export const LocoBodyInfo: CategoryComponent<'body-info'> = ({ data, lang }) => {
  const rowsRef = useStaggeredReveal<HTMLDListElement>({ delayStep: 0.055 });
  const figARef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const figBRef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const images  = data.images ?? [];

  return (
    <Page type="body" className="loco-info loco-info--body">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-info__body-spread">
        <div className="loco-info__stack">
          <div
            ref={figARef}
            className="loco-info__figure loco-info__figure--tall"
            data-reveal="mask"
            data-parallax="0.14"
          >
            {images[0]
              ? <ShaderImage src={images[0]} alt="" />
              : <div className="loco-info__placeholder" />}
          </div>
          <div
            ref={figBRef}
            className="loco-info__figure loco-info__figure--wide"
            data-reveal="mask"
            data-parallax="0.1"
          >
            {images[1]
              ? <ShaderImage src={images[1]} alt="" />
              : <div className="loco-info__placeholder" />}
          </div>
        </div>
        <dl ref={rowsRef} className="loco-info__fields loco-info__fields--metric">
          {(data.fields ?? []).map((f, i) => (
            <div className="loco-info__row" key={i} data-reveal="up">
              <dt className="loco-info__label">
                <span className="loco-info__idx">{String(i + 1).padStart(2, '0')}</span>
                {t(f.label, lang)}
              </dt>
              <dd className="loco-info__value loco-info__value--metric">
                {t(f.value, lang)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Page>
  );
};
