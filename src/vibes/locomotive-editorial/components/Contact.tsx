import type { JSX } from 'react';
import { Page, SectionHead } from '../../base/Page';
import { t } from '@/lib/translate';
import {
  useReveal, useStaggeredReveal, useSplitText, useMagnetic, ShaderImage,
} from '@/lib/motion';
import type { CategoryComponent } from '../../types';
import type { ContactIconKey } from '@/types/content';

const ICON: Record<ContactIconKey, JSX.Element> = {
  phone: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  email: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
    </svg>
  ),
  facebook: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 22v-8h3l1-4h-4V7c0-1.2.4-2 2-2h2V1.5C16 1.2 14.8 1 13.3 1 10.5 1 9 2.7 9 5.8V10H5v4h4v8h4z" />
    </svg>
  ),
  tiktok: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 3v3.3c1 1 2.5 1.7 4 1.7v3a8 8 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z" />
    </svg>
  ),
  instagram: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  youtube: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 7s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C17.1 3.4 12 3.4 12 3.4s-5.1 0-8.1.3c-.4 0-1.3.1-2.1 1C1.2 5.4 1 7 1 7s-.2 1.8-.2 3.7v1.8c0 1.9.2 3.7.2 3.7s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.8.3 7.8.3s5.1 0 8.1-.3c.4 0 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.8.2-3.7v-1.8c0-1.9-.2-3.7-.2-3.7zM9.7 15V7.9l6.4 3.6-6.4 3.6z" />
    </svg>
  ),
};

/**
 * Contact — editorial close. Cinematic split with a shader portrait on the
 * left and a column of magnetic contact rows on the right. Each row attracts
 * the cursor as the pointer nears it, giving the page a tactile farewell.
 */
export const LocoContact: CategoryComponent<'contact'> = ({ data, lang }) => {
  const tagRef  = useSplitText<HTMLParagraphElement>({ threshold: 0.2 });
  const listRef = useStaggeredReveal<HTMLDivElement>({ delayStep: 0.07 });
  const figRef  = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const entries = data.entries ?? [];

  return (
    <Page type="contact" className="loco-contact">
      <SectionHead eyebrow={t(data.subheading, lang)} title={t(data.heading, lang)} />
      <div className="loco-contact__spread">
        <aside
          ref={figRef}
          className="loco-contact__figure"
          data-reveal="mask"
          data-parallax="0.1"
        >
          {data.image
            ? <ShaderImage src={data.image} alt="" />
            : <div className="loco-contact__placeholder" />}
          <div className="loco-contact__fig-cap">
            <span>Portrait</span>
            <span className="loco-contact__fig-rule" aria-hidden="true" />
            <span>Signing off</span>
          </div>
        </aside>
        <div className="loco-contact__body">
          <p ref={tagRef} className="loco-contact__tag">
            Let's make something worth watching.
          </p>
          <div ref={listRef} className="loco-contact__list">
            {entries.map((e, i) => (
              <ContactRow
                key={i}
                index={i}
                icon={ICON[e.icon] ?? null}
                href={e.href || '#'}
                label={t(e.label, lang)}
                value={t(e.value, lang)}
              />
            ))}
          </div>
          <div className="loco-contact__sign" aria-hidden="true">
            <span>—</span>
            <em>Lâm Thanh Tiệp</em>
          </div>
        </div>
      </div>
    </Page>
  );
};

function ContactRow({
  index, icon, href, label, value,
}: {
  index: number;
  icon: JSX.Element | null;
  href: string;
  label: string;
  value: string;
}) {
  const magnetRef = useMagnetic<HTMLAnchorElement>({ strength: 0.22 });
  return (
    <a
      ref={magnetRef}
      className="loco-contact__row"
      href={href}
      target="_blank"
      rel="noopener"
      data-reveal="left"
      data-cursor="link"
      data-cursor-label="Open"
    >
      <span className="loco-contact__row-idx">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="loco-contact__row-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="loco-contact__row-text">
        <span className="loco-contact__row-label">{label}</span>
        <span className="loco-contact__row-value">{value}</span>
      </span>
      <span className="loco-contact__row-arrow" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>
    </a>
  );
}
