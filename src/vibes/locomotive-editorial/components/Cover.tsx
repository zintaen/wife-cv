import { useRef } from 'react';
import { Page } from '../../base/Page';
import { t } from '@/lib/translate';
import { ShaderImage, useReveal, useSplitText, useMagnetic } from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Flagship cover — a cinematic hero. On screen: viewport-fluid slab with split-
 * text name reveal, shader-driven portrait, editorial marginalia (year, ref,
 * scroll cue). On print: collapses to A4 landscape via the @media print rules
 * in theme.css, so the exported PDF stays portfolio-shaped.
 */
export const LocoCover: CategoryComponent<'cover'> = ({ data, lang }) => {
  const nameRef   = useSplitText<HTMLDivElement>({ threshold: 0.2 });
  const labelRef  = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const rolesRef  = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const metaRef   = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const scrollRef = useMagnetic<HTMLDivElement>({ strength: 0.28 });
  const year = new Date().getFullYear();

  return (
    <Page type="cover" className="loco-cover">
      <div className="loco-cover__frame">
        <div className="loco-cover__rule loco-cover__rule--top" aria-hidden="true" />
        <div className="loco-cover__rule loco-cover__rule--bot" aria-hidden="true" />

        <header className="loco-cover__margins" ref={metaRef} data-reveal="fade">
          <div className="loco-cover__mark">
            <span className="loco-cover__mark-l">L</span>
            <span className="loco-cover__mark-t">T</span>
            <span className="loco-cover__mark-t2">T</span>
          </div>
          <div className="loco-cover__code">
            <span>No. 001</span><span>—</span><span>{year}</span>
          </div>
          <div className="loco-cover__label">
            {t(data.portfolio_label, lang) || 'PORTFOLIO'}
          </div>
        </header>

        <div className="loco-cover__stage">
          <div className="loco-cover__media" data-parallax="0.18">
            {data.image
              ? <ShaderImage src={data.image} alt={t(data.name, lang)} />
              : <div className="loco-cover__placeholder" />}
            <div className="loco-cover__media-overlay" aria-hidden="true" />
            <div className="loco-cover__media-caption">
              <span>{t(data.portfolio_label, lang) || 'PORTFOLIO'}</span>
              <span>·</span>
              <span>{year}</span>
            </div>
          </div>

          <div className="loco-cover__copy">
            <div className="loco-cover__eyebrow" ref={labelRef} data-reveal="up">
              <span>{String(year).slice(-2)}</span>
              <span className="loco-cover__eyebrow-rule" />
              <span>Acting · Voice · Song</span>
            </div>
            <h1
              ref={nameRef}
              className="loco-cover__name"
              data-cursor-label="Open reel"
            >
              {t(data.name, lang)}
            </h1>
            <div
              ref={rolesRef}
              className="loco-cover__roles"
              data-reveal="up"
            >
              {(data.roles ?? []).map((r, i) => (
                <span key={i} className="loco-cover__role">
                  <em>{String(i + 1).padStart(2, '0')}</em>
                  {t(r, lang)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <footer className="loco-cover__footer">
          <div
            ref={scrollRef}
            className="loco-cover__scroll"
            data-cursor="view"
            data-cursor-label="Scroll to explore"
          >
            <span className="loco-cover__scroll-tick" />
            <span>Scroll</span>
            <span className="loco-cover__scroll-arrow">↓</span>
          </div>
          <div className="loco-cover__credit">
            A cinematic index · <em>Lâm Thanh Tiệp</em>
          </div>
        </footer>
      </div>
    </Page>
  );
};
