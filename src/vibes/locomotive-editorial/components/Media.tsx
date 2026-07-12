import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  useReveal, useStaggeredReveal, ShaderImage, TheaterMode,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';

const stripScheme = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Media — press archive. Each mention becomes an editorial card: a shader-backed
 * poster, a play-title, and a list of hover-underlined source links. The grid
 * itself is a theater scope — clicking a poster opens it full-bleed with
 * curtain reveal. A signature number sits on every card for archive feel.
 */
export const LocoMedia: CategoryComponent<'media'> = ({ data, lang }) => {
  const gridRef  = useStaggeredReveal<HTMLDivElement>({ delayStep: 0.08 });
  const introRef = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const mentions = data.mentions ?? [];

  return (
    <Page type="media" className="loco-media">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div ref={introRef} className="loco-media__meta" data-reveal="up">
        <span>Archive</span>
        <span className="loco-media__meta-num">{String(mentions.length).padStart(2, '0')}</span>
        <span className="loco-media__meta-rule" aria-hidden="true" />
        <span>press · interviews · features</span>
      </div>
      <TheaterMode>
        <div ref={gridRef} className="loco-media__grid">
          {mentions.map((m, i) => (
            <article
              key={i}
              className="loco-media__card"
              data-reveal="up"
            >
              <div
                className="loco-media__poster"
                data-theater-src={m.poster || undefined}
                data-cursor={m.poster ? 'view' : undefined}
                data-cursor-label={m.poster ? 'View' : undefined}
              >
                {m.poster
                  ? <ShaderImage src={m.poster} alt={t(m.play, lang)} />
                  : <div className="loco-media__poster-empty" />}
                <span className="loco-media__card-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="loco-media__card-body">
                <h3 className="loco-media__card-title">{t(m.play, lang)}</h3>
                <ul className="loco-media__links">
                  {(m.links ?? []).map((l, j) => (
                    <li key={j} className="loco-media__link-row">
                      <span className="loco-media__link-dash" aria-hidden="true" />
                      <a
                        className="loco-media__link"
                        href={l}
                        target="_blank"
                        rel="noopener"
                        data-cursor="link"
                        data-cursor-label="Open"
                      >
                        {stripScheme(l)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </TheaterMode>
    </Page>
  );
};
