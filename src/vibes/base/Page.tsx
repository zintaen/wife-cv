import type { ReactNode } from 'react';

/**
 * The physical page primitive. All category components return one or more of
 * these. The footer is populated by <Portfolio> after layout so page numbers
 * are correct across all categories.
 */
export function Page(props: {
  type: string;
  title?: string;
  className?: string;
  selected?: boolean;
  children: ReactNode;
}) {
  const cls = ['page', `page--${props.type}`, props.className, props.selected ? 'is-selected' : '']
    .filter(Boolean).join(' ');
  return (
    <article className={cls} data-title={props.title ?? ''}>
      <div className="page__body">{props.children}</div>
      <footer className="page__footer" />
    </article>
  );
}

export function SectionHead(props: { eyebrow?: string; title?: string }) {
  const parts = (props.title ?? '').split(' ');
  const first = parts.shift() ?? '';
  const rest  = parts.join(' ');
  return (
    <header className="section-head">
      <div className="section-head__eyebrow">{props.eyebrow ?? ''}</div>
      <h2 className="section-head__title">
        {first}
        {rest ? <> <em>{rest}</em></> : null}
      </h2>
      <div className="section-head__rule" />
    </header>
  );
}
