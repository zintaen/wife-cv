import { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { pickComponent } from '@/vibes';
import { footerNameForLang } from '@/lib/translate';
import { ui } from '@/i18n/strings';

export function Portfolio() {
  const content     = useStore(s => s.content);
  const lang        = useStore(s => s.lang);
  const vibe        = useStore(s => s.vibe);
  const orientation = useStore(s => s.orientation);
  const selectedId  = useStore(s => s.selectedId);
  const ref         = useRef<HTMLDivElement>(null);

  // Apply vibe + orientation on <body> so each vibe's theme.css takes effect.
  useEffect(() => {
    document.body.dataset.vibe        = vibe;
    document.body.dataset.orientation = orientation;
  }, [vibe, orientation]);

  // After every render, stamp page numbers + the footer stage-name onto each
  // .page__footer. This matches the old vanilla behavior: page-number is global
  // across the whole portfolio, not per-category.
  useLayoutEffect(() => {
    const root = ref.current; if (!root) return;
    const pages = Array.from(root.querySelectorAll<HTMLElement>('.page'));
    const footerName = footerNameForLang(content?.meta.name, lang);
    pages.forEach((p, i) => {
      const footer = p.querySelector<HTMLElement>('.page__footer');
      if (footer) {
        footer.dataset.page   = String(i + 1).padStart(2, '0');
        footer.dataset.footer = footerName;
      }
      // Highlight pages belonging to the selected category.
      const catId = p.dataset.catId;
      p.classList.toggle('is-selected', !!catId && catId === selectedId);
    });
  });

  if (!content) {
    return (
      <main className="portfolio app__preview" aria-busy>
        <div className="loading">{ui(lang, 'loading')}</div>
      </main>
    );
  }

  return (
    <main className="portfolio app__preview" aria-busy={false} ref={ref}>
      {content.categories.map(cat => {
        // pickComponent is a `<T extends CategoryType>` lookup; its result is
        // typed to the category's narrow data type. We cast `cat as never` so
        // the union resolves to the exact component signature at the callsite.
        const Component = pickComponent(vibe, cat.type) as React.FC<{
          data: typeof cat.data; cat: typeof cat; lang: typeof lang;
        }>;
        return (
          <CatWrapper key={cat.id} catId={cat.id}>
            <Component data={cat.data} cat={cat as never} lang={lang} />
          </CatWrapper>
        );
      })}
    </main>
  );
}

// Tags every .page descendant with data-cat-id so the footer-stamp pass above
// knows which category a page belongs to.
function CatWrapper({ catId, children }: { catId: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const n = ref.current; if (!n) return;
    n.querySelectorAll<HTMLElement>('.page').forEach(p => { p.dataset.catId = catId; });
  });
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
