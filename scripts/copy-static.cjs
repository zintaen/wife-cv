/**
 * Post-build step: copy mutable content (content.json + images/ + fonts/) into
 * dist/ so Vercel (or any static host) can serve them alongside the Vite build.
 *
 * Kept separate from Vite's publicDir because those assets live at the repo
 * root (where the Node dev server already serves them), and moving them into
 * a single publicDir would break the local dev workflow in server.cjs.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    const st = fs.statSync(s);
    if (st.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist — run "vite build" first.');
  process.exit(1);
}

// content.json: the source of truth for the whole portfolio.
fs.copyFileSync(path.join(ROOT, 'content.json'), path.join(DIST, 'content.json'));

// images/: referenced by content.json via relative paths like "images/cover-01.jpeg".
const imgN = copyDir(path.join(ROOT, 'images'), path.join(DIST, 'images'));

// fonts/: custom fonts uploaded via the editor, served at /fonts/* at runtime.
const fontN = copyDir(path.join(ROOT, 'fonts'), path.join(DIST, 'fonts'));

console.log(`copy-static: content.json + ${imgN} image(s) + ${fontN} font file(s) → dist/`);
