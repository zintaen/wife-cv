/**
 * Tiny static + API server for the portfolio.
 *
 *   GET  /*                    -> serve files from ./ (the portfolio folder)
 *   GET  /api/content          -> read content.json
 *   PUT  /api/content          -> write content.json (JSON body)
 *   GET  /api/images           -> list files in images/
 *   POST /api/images           -> upload one image. JSON body: { filename, dataUrl }
 *   DELETE /api/images/:name   -> delete an image
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
const CONTENT = path.join(ROOT, 'content.json');
const IMAGES = path.join(ROOT, 'images');
const PORT = Number(process.env.PORT) || 8765;

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

// --------------------------------------------------- static
async function serveStatic(req, res, pathname) {
  // Default file
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';

  const abs = safeResolve(ROOT, rel);
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

    if (p.startsWith('/api/')) return sendError(res, 404, 'No such endpoint');

    if (req.method === 'GET') return serveStatic(req, res, p);
    send(res, 405, 'Method not allowed');
  } catch (e) {
    console.error(e);
    sendError(res, 500, e.message);
  }
});

server.listen(PORT, () => {
  console.log(`portfolio studio → http://localhost:${PORT}/`);
});
