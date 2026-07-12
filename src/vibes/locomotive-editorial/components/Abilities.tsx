import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import { useReveal, useStaggeredReveal, ShaderImage } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Abilities — craft index. Skills rendered as type-driven rows with a
 * percent-filled horizontal bar (not a ring — the editorial grammar wants
 * straight metric bars). The bar width reveals in via `--pct` after the row
 * is visible. A shader portrait anchors the right column.
 */
export const LocoAbilities: CategoryComponent<'abilities'> = ({ data, lang }) => {
  const listRef = useStaggeredReveal<HTMLUListElement>({ delayStep: 0.07 });
  const figRef  = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const skills  = data.skills ?? [];

  return (
    <Page type="abilities" className="loco-abilities">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-abilities__spread">
        <ul ref={listRef} className="loco-abilities__list">
          {skills.map((s, i) => (
            <li
              key={i}
              className="loco-abilities__item"
              data-reveal="up"
              style={{ ['--pct' as never]: `${s.percent}%` } as React.CSSProperties}
            >
              <div className="loco-abilities__row">
                <span className="loco-abilities__num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="loco-abilities__name">{t(s.name, lang)}</span>
                <span className="loco-abilities__pct">{s.percent}%</span>
              </div>
              <div className="loco-abilities__bar" aria-hidden="true">
                <span className="loco-abilities__bar-fill" />
              </div>
            </li>
          ))}
        </ul>
        <aside
          ref={figRef}
          className="loco-abilities__figure"
          data-reveal="mask"
          data-parallax="0.12"
        >
          {data.image
            ? <ShaderImage src={data.image} alt="" />
            : <div className="loco-abilities__placeholder" />}
          <div className="loco-abilities__fig-cap">
            <span>Fig.</span>
            <span>Craft · calibration</span>
          </div>
        </aside>
      </div>
    </Page>
  );
};
