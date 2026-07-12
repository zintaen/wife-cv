import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  useReveal, useStaggeredReveal, useSplitText, ShaderImage, TheaterMode, HoverThumb,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * TV — editorial split. Four-up shader gallery on the left (tappable into
 * theater mode), a hover-thumb filmography list on the right — moving the
 * cursor over a show preview-reveals a still that tracks the pointer.
 */
export const LocoExperiencesTv: CategoryComponent<'experiences-tv'> = ({ data, lang }) => {
  const introRef  = useSplitText<HTMLParagraphElement>({ threshold: 0.2 });
  const listRef   = useStaggeredReveal<HTMLUListElement>({ delayStep: 0.05 });
  const galleryRef = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const images    = (data.images ?? []).slice(0, 4);
  const shows     = data.shows ?? [];

  return (
    <Page type="tv" className="loco-tv">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-tv__spread">
        <TheaterMode>
          <div
            ref={galleryRef}
            className="loco-tv__gallery"
            data-reveal="fade"
          >
            {images.map((src, i) => (
              <div
                key={i}
                className="loco-tv__tile"
                data-theater-src={src}
                data-cursor="view"
                data-cursor-label="View"
                data-parallax={i % 2 ? '0.08' : '0.12'}
              >
                {src ? <ShaderImage src={src} alt="" /> : null}
                <span className="loco-tv__tile-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </TheaterMode>
        <div className="loco-tv__copy">
          {t(data.intro, lang) ? (
            <p ref={introRef} className="loco-tv__intro">
              {t(data.intro, lang)}
            </p>
          ) : null}
          <HoverThumb className="loco-tv__hover">
            <ul ref={listRef} className="loco-tv__shows">
              {shows.map((s, i) => {
                const thumb = images[i % Math.max(images.length, 1)] ?? '';
                return (
                  <li
                    key={i}
                    className="loco-tv__show"
                    data-reveal="left"
                    data-thumb={thumb || undefined}
                    data-cursor-label={thumb ? 'Peek' : undefined}
                  >
                    <span className="loco-tv__show-idx">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="loco-tv__show-title">{t(s, lang)}</span>
                    <span className="loco-tv__show-rule" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          </HoverThumb>
        </div>
      </div>
    </Page>
  );
};
