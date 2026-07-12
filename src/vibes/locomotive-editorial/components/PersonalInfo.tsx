import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import { useReveal, useStaggeredReveal, ShaderImage } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Personal info — editorial dossier. A labelled column of fields on the left,
 * a shader portrait on the right, all wrapped in a thin frame with tickmarks.
 * Each row staggers in. The portrait is revealed with a mask-clip.
 */
export const LocoPersonalInfo: CategoryComponent<'personal-info'> = ({ data, lang }) => {
  const gridRef  = useStaggeredReveal<HTMLDListElement>({ delayStep: 0.06 });
  const figRef   = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <Page type="personal" className="loco-info loco-info--personal">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-info__spread">
        <aside
          ref={figRef}
          className="loco-info__figure"
          data-reveal="mask"
          data-parallax="0.12"
        >
          {data.image
            ? <ShaderImage src={data.image} alt="" />
            : <div className="loco-info__placeholder" />}
          <div className="loco-info__frame-corners" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
        </aside>
        <dl ref={gridRef} className="loco-info__fields">
          {(data.fields ?? []).map((f, i) => (
            <div className="loco-info__row" key={i} data-reveal="up">
              <dt className="loco-info__label">
                <span className="loco-info__idx">{String(i + 1).padStart(2, '0')}</span>
                {t(f.label, lang)}
              </dt>
              <dd className="loco-info__value">{t(f.value, lang)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Page>
  );
};
