// Ambient types for non-TS imports. Vite handles the actual transformation;
// TypeScript only needs to know these imports resolve to something.
/// <reference types="vite/client" />

// CSS Modules — keyed by class name. Scoped class names come back as string.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Plain CSS side-effect imports (e.g. theme.css, base.css)
declare module '*.css';
