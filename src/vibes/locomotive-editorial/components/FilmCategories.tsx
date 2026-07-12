import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  useReveal, useStaggeredReveal, ShaderImage, TheaterMode,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * Film categories — editorial mosaic. A 9-up shader gallery (tappable theater)
 * on one half, a staggered category list on the other. Each category becomes
 * a row with its icon promoted to a typographic "chapter letter", followed by
 * the comma-joined works.
 */
export const LocoFilmCategories: CategoryComponent<'film-categories'> = ({ data, lang }) => {
  const listRef    = useStaggeredReveal<HTMLDivElement>({ delayStep: 0.06 });
  const galleryRef = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const cats       = data.categories ?? [];
  const images     = (data.images ?? []).slice(0, 9);

  return (
    <Page type="film" className="loco-film">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-film__spread">
        <TheaterMode>
          <div
            ref={galleryRef}
            className="loco-film__gallery"
            data-reveal="fade"
          >
            {images.map((src, i) => (
              <div
                key={i}
                className="loco-film__tile"
                data-theater-src={src}
                data-cursor="view"
                data-cursor-label="View"
                style={{ ['--idx' as never]: i } as React.CSSProperties}
              >
                {src ? <ShaderImage src={src} alt="" /> : null}
              </div>
            ))}
          </div>
        </TheaterMode>
        <div ref={listRef} className="loco-film__cats">
          {cats.map((c, i) => (
            <article
              className="loco-film__cat"
              key={i}
              data-reveal="up"
            >
              <div className="loco-film__cat-icon" aria-hidden="true">
                {c.icon}
              </div>
              <div className="loco-film__cat-body">
                <h3 className="loco-film__cat-title">
                  <span className="loco-film__cat-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {t(c.title, lang)}
                </h3>
                <div className="loco-film__cat-works">
                  {(c.works ?? []).map((w, j) => (
                    <span key={j} className="loco-film__cat-work">
                      {t(w, lang)}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Page>
  );
};
