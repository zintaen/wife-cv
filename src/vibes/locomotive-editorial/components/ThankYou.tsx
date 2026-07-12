import { Page } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  useReveal, useSplitText, ShaderImage, Marquee,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';

/**
 * ThankYou — cinematic end card. A six-tile shader collage fills the stage,
 * overlaid by an oversized split-text headline ("THANK YOU") with a signed
 * dedication, and a bottom marquee that runs indefinitely. Feels like the
 * final frame of a title sequence rather than a portfolio sign-off.
 */
export const LocoThankYou: CategoryComponent<'thankyou'> = ({ data, lang }) => {
  const title = t(data.heading, lang) || 'THANK YOU';
  const sub   = data.subheading ? t(data.subheading, lang) : '';
  const images = (data.images ?? []).slice(0, 6);
  const titleRef = useSplitText<HTMLHeadingElement>({ threshold: 0.05 });
  const subRef   = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const stageRef = useReveal<HTMLDivElement>({ threshold: 0.08 });

  return (
    <Page type="thankyou" className="loco-thanks">
      <div
        ref={stageRef}
        className="loco-thanks__stage"
        data-reveal="fade"
      >
        <div className="loco-thanks__mosaic" aria-hidden="true">
          {images.length > 0
            ? images.map((src, i) => (
                <div
                  key={i}
                  className="loco-thanks__tile"
                  style={{ ['--idx' as never]: i } as React.CSSProperties}
                  data-parallax={i % 2 ? '0.05' : '0.09'}
                >
                  {src ? <ShaderImage src={src} alt="" /> : null}
                </div>
              ))
            : (
              <div className="loco-thanks__tile loco-thanks__tile--empty" />
            )}
        </div>
        <div className="loco-thanks__veil" aria-hidden="true" />
        <div className="loco-thanks__overlay">
          <div className="loco-thanks__kicker">
            <span>Fin.</span>
            <span className="loco-thanks__kicker-rule" aria-hidden="true" />
            <span>End credits</span>
          </div>
          <h2 ref={titleRef} className="loco-thanks__title">
            {title}
          </h2>
          {sub ? (
            <p ref={subRef} className="loco-thanks__sub" data-reveal="up">
              {sub}
            </p>
          ) : null}
          <div className="loco-thanks__sign">
            <span>—</span>
            <em>Lâm Thanh Tiệp</em>
          </div>
        </div>
      </div>
      <Marquee duration={48} gap="5rem" className="loco-thanks__marquee">
        <span>Thank you</span>
        <span className="loco-thanks__marquee-em">·</span>
        <span>Cảm ơn</span>
        <span className="loco-thanks__marquee-em">·</span>
        <span>谢谢</span>
        <span className="loco-thanks__marquee-em">·</span>
        <span><em>Until the next curtain</em></span>
        <span className="loco-thanks__marquee-em">·</span>
      </Marquee>
    </Page>
  );
};
