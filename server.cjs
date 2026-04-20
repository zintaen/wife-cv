/**
 * Tiny static + API server for the portfolio.
 *
 *   GET  /*                    -> serve files from ./ (the portfolio folder)
 *   GET  /api/content          -> read content.json
 *   PUT  /api/content          -> write content.json (JSON body)
 *   GET  /api/images           -> list files in images/
 *   POST /api/images           -> upload one image. JSON body: { filename, dataUrl }
 *   DELETE /api/images/:name   -> delete an image
 *   GET  /api/fonts            -> list custom fonts in fonts/ (with declared family)
 *   POST /api/fonts            -> upload one font. JSON body: { filename, family, dataUrl }
 *   DELETE /api/fonts/:name    -> delete a custom font
 *
 * Run with:
 *   node server.js
 * then open http://localhost:8765 (unified portfolio studio — edit + live preview)
 *
 * Zero npm dependencies — only Node core modules.
 */

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const url = require('url');

const ROOT = __dirname;                              // portfolio/
const DIST = path.join(ROOT, 'dist');                // built client (vite build output)
const CONTENT = path.join(ROOT, 'content.json');
const IMAGES = path.join(ROOT, 'images');
const FONTS = path.join(ROOT, 'fonts');
const FONTS_INDEX = path.join(FONTS, 'index.json');
const PORT = Number(process.env.PORT) || 8765;

// Ensure fonts/ exists
try { fs.mkdirSync(FONTS, { recursive: true }); } catch (_) { /* ok */ }

// --------------------------------------------------- MIME map
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.txt':  'text/plain; charset=utf-8',
};

// --------------------------------------------------- helpers
function send(res, code, body, headers = {}) {
  res.writeHead(code, Object.assign({ 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}
function sendJson(res, code, obj) {
  send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}
function sendError(res, code, msg) {
  sendJson(res, code, { ok: false, error: msg });
}
function readBody(req, limitBytes = 50 * 1024 * 1024) {
  // 50 MB cap — generous for image uploads
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', c => {
      total += c.length;
      if (total > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Refuse anything that would escape ROOT
function safeResolve(base, ...parts) {
  const p = path.resolve(base, ...parts);
  if (p !== base && !p.startsWith(base + path.sep)) return null;
  return p;
}

// Very permissive but still safe filename: letters, digits, dash, underscore, dot
function sanitizeFilename(name) {
  const base = path.basename(String(name || ''));
  if (!/^[A-Za-z0-9._-]+$/.test(base)) return null;
  if (base.startsWith('.')) return null;
  return base;
}

// --------------------------------------------------- API handlers
async function apiGetContent(req, res) {
  try {
    const buf = await fsp.readFile(CONTENT);
    send(res, 200, buf, { 'Content-Type': 'application/json; charset=utf-8' });
  } catch (e) {
    sendError(res, 500, 'Could not read content.json: ' + e.message);
  }
}

async function apiPutContent(req, res) {
  try {
    const body = await readBody(req);
    // Validate JSON before saving
    const parsed = JSON.parse(body.toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Body must be a JSON object');
    }
    // Schema sanity check — prevents a buggy client from wiping content.json
    if (!parsed.meta || typeof parsed.meta !== 'object') {
      throw new Error('Body missing required "meta" object');
    }
    if (!Array.isArray(parsed.categories)) {
      throw new Error('Body missing required "categories" array');
    }
    if (parsed.categories.length === 0) {
      throw new Error('Refusing to save empty categories array');
    }
    // Each category must have id + type + data
    for (let i = 0; i < parsed.categories.length; i++) {
      const cat = parsed.categories[i];
      if (!cat || typeof cat !== 'object') throw new Error(`categories[${i}] must be an object`);
      if (!cat.id || typeof cat.id !== 'string') throw new Error(`categories[${i}].id missing`);
      if (!cat.type || typeof cat.type !== 'string') throw new Error(`categories[${i}].type missing`);
      if (!cat.data || typeof cat.data !== 'object') throw new Error(`categories[${i}].data missing`);
    }

    // Backup previous version for safety
    try {
      await fsp.copyFile(CONTENT, CONTENT + '.bak');
    } catch (_) { /* first save, fine */ }

    await fsp.writeFile(CONTENT, JSON.stringify(parsed, null, 2));
    sendJson(res, 200, { ok: true });
  } catch (e) {
    sendError(res, 400, e.message);
  }
}

async function apiListImages(req, res) {
  try {
    const files = await fsp.readdir(IMAGES);
    const rows = await Promise.all(files
      .filter(f => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
      .map(async f => {
        const st = await fsp.stat(path.join(IMAGES, f));
        return { name: f, size: st.size, mtime: st.mtime };
      }));
    rows.sort((a, b) => a.name.localeCompare(b.name));
    sendJson(res, 200, { ok: true, images: rows });
  } catch (e) {
    sendError(res, 500, e.message);
  }
}

async function apiUploadImage(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body.toString('utf8'));
    const filename = sanitizeFilename(payload.filename);
    if (!filename) return sendError(res, 400, 'Invalid filename');
    const m = /^data:([^;]+);base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!m) return sendError(res, 400, 'Invalid dataUrl');
    const mime = m[1].toLowerCase();
    if (!mime.startsWith('image/')) return sendError(res, 400, 'Not an image');
    const data = Buffer.from(m[2], 'base64');
    const target = safeResolve(IMAGES, filename);
    if (!target) return sendError(res, 400, 'Bad path');
    await fsp.writeFile(target, data);
    sendJson(res, 200, { ok: true, name: filename, url: `images/${filename}` });
  } catch (e) {
    sendError(res, 400, e.message);
  }
}

async function apiDeleteImage(req, res, name) {
  try {
    const filename = sanitizeFilename(name);
    if (!filename) return sendError(res, 400, 'Invalid filename');
    const target = safeResolve(IMAGES, filename);
    if (!target) return sendError(res, 400, 'Bad path');
    await fsp.unlink(target);
    sendJson(res, 200, { ok: true });
  } catch (e) {
    sendError(res, 404, e.message);
  }
}

// --------------------------------------------------- /api/fonts
// A small JSON index tracks { name -> family } so uploads preserve the
// human-facing family name across restarts.
async function readFontIndex() {
  try {
    const buf = await fsp.readFile(FONTS_INDEX, 'utf8');
    const v = JSON.parse(buf);
    return (v && typeof v === 'object') ? v : {};
  } catch (_) { return {}; }
}
async function writeFontIndex(idx) {
  await fsp.writeFile(FONTS_INDEX, JSON.stringify(idx, null, 2));
}

// Allow-list font extensions
const FONT_EXT_RE = /\.(woff2?|ttf|otf)$/i;
const FONT_MIME_OK = /^(font\/|application\/(x-)?font|application\/octet-stream|application\/vnd\.ms-fontobject)/i;

async function apiListFonts(req, res) {
  try {
    const idx = await readFontIndex();
    let files = [];
    try { files = await fsp.readdir(FONTS); } catch (_) { files = []; }
    const rows = await Promise.all(files
      .filter(f => FONT_EXT_RE.test(f))
      .map(async f => {
        const st = await fsp.stat(path.join(FONTS, f));
        return {
          name: f,
          family: idx[f] || f.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          url: `fonts/${f}`,
          size: st.size,
          mtime: st.mtime,
        };
      }));
    rows.sort((a, b) => a.family.localeCompare(b.family));
    sendJson(res, 200, { ok: true, fonts: rows });
  } catch (e) {
    sendError(res, 500, e.message);
  }
}

async function apiUploadFont(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body.toString('utf8'));
    const filename = sanitizeFilename(payload.filename);
    if (!filename) return sendError(res, 400, 'Invalid filename');
    if (!FONT_EXT_RE.test(filename)) {
      return sendError(res, 400, 'Unsupported font extension (expected .woff, .woff2, .ttf or .otf)');
    }
    const family = String(payload.family || '').trim();
    if (!family) return sendError(res, 400, 'Missing font family name');
    const m = /^data:([^;]+);base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!m) return sendError(res, 400, 'Invalid dataUrl');
    const mime = m[1].toLowerCase();
    if (!FONT_MIME_OK.test(mime) && mime !== '') {
      return sendError(res, 400, 'Not a font file (mime: ' + mime + ')');
    }
    const data = Buffer.from(m[2], 'base64');
    const target = safeResolve(FONTS, filename);
    if (!target) return sendError(res, 400, 'Bad path');
    await fsp.writeFile(target, data);

    const idx = await readFontIndex();
    idx[filename] = family;
    await writeFontIndex(idx);

    sendJson(res, 200, {
      ok: true,
      name: filename,
      family,
      url: `fonts/${filename}`,
    });
  } catch (e) {
    sendError(res, 400, e.message);
  }
}

async function apiDeleteFont(req, res, name) {
  try {
    const filename = sanitizeFilename(name);
    if (!filename) return sendError(res, 400, 'Invalid filename');
    const target = safeResolve(FONTS, filename);
    if (!target) return sendError(res, 400, 'Bad path');
    try {
      await fsp.unlink(target);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e; // ignore "already gone", surface EPERM/etc.
    }
    const idx = await readFontIndex();
    if (idx[filename]) { delete idx[filename]; await writeFontIndex(idx); }
    sendJson(res, 200, { ok: true });
  } catch (e) {
    sendError(res, 500, e.message);
  }
}

// --------------------------------------------------- static
//
// Routing:
//   /images/**  -> serve from ROOT/images   (content, not build output)
//   /fonts/**   -> serve from ROOT/fonts    (content, not build output)
//   /**         -> serve from ROOT/dist     (vite build output; SPA fallback to dist/index.html)
//
// The SPA fallback lets deep-link routes (e.g. future /edit/:id) still boot
// React — if the requested asset isn't a file, we return dist/index.html with
// 200 so the client router can handle the rest.
async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '');

  // Content dirs live at the repo root and are mutable.
  let base = DIST;
  if (rel.startsWith('images/') || rel === 'images') base = ROOT;
  else if (rel.startsWith('fonts/') || rel === 'fonts') base = ROOT;

  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const abs = safeResolve(base, rel);
  if (!abs) return send(res, 403, 'Forbidden');

  try {
    const st = await fsp.stat(abs);
    if (st.isDirectory()) {
      return serveStatic(req, res, pathname.replace(/\/?$/, '/') + 'index.html');
    }
    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const buf = await fsp.readFile(abs);
    send(res, 200, buf, { 'Content-Type': type });
  } catch (e) {
    // SPA fallback: unknown path under DIST → serve the built index.html so
    // the React app boots and can route. Only triggers when a dist build
    // exists — otherwise the user sees a real 404.
    if (base === DIST && !rel.startsWith('assets/')) {
      try {
        const fallback = path.join(DIST, 'index.html');
        const buf = await fsp.readFile(fallback);
        return send(res, 200, buf, { 'Content-Type': MIME['.html'] });
      } catch (_) { /* no build yet — fall through */ }
    }
    send(res, 404, 'Not found: ' + rel);
  }
}

// --------------------------------------------------- router
const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  const p = u.pathname;
  try {
    if (p === '/api/content' && req.method === 'GET')  return apiGetContent(req, res);
    if (p === '/api/content' && req.method === 'PUT')  return apiPutContent(req, res);
    if (p === '/api/images'  && req.method === 'GET')  return apiListImages(req, res);
    if (p === '/api/images'  && req.method === 'POST') return apiUploadImage(req, res);
    const delMatch = /^\/api\/images\/(.+)$/.exec(p);
    if (delMatch && req.method === 'DELETE') return apiDeleteImage(req, res, delMatch[1]);

    if (p === '/api/fonts' && req.method === 'GET')  return apiListFonts(req, res);
    if (p === '/api/fonts' && req.method === 'POST') return apiUploadFont(req, res);
    const delFontMatch = /^\/api\/fonts\/(.+)$/.exec(p);
    if (delFontMatch && req.method === 'DELETE') return apiDeleteFont(req, res, delFontMatch[1]);

    if (p.startsWith('/api/')) return sendError(res, 404, 'No such endpoint');

    if (req.method === 'GET') return serveStatic(req, res, p);
    send(res, 405, 'Method not allowed');
  } catch (e) {
    console.error(e);
    sendError(res, 500, e.message);
  }
});

server.listen(PORT, () => {
  const hasBuild = fs.existsSync(path.join(DIST, 'index.html'));
  console.log(`portfolio studio api → http://localhost:${PORT}/`);
  console.log(`  content + images + fonts endpoints live under /api/*`);
  if (hasBuild) {
    console.log(`  serving built client from ${path.relative(ROOT, DIST)}/`);
  } else {
    console.log(`  (no ./dist build found — run "npm run build", or use vite dev on :5173)`);
  }
});
