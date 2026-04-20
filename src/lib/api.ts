// Thin client for the server's /api/* endpoints, with a static-host fallback.
//
// When the app runs on a plain static host (e.g. Vercel) there is no Node
// server behind /api/*, so GETs transparently fall through to the baked
// artifacts copied into dist/ by scripts/copy-static.cjs. Writes still hit
// /api/* — they'll fail in static mode, and the store surfaces that by
// disabling the editor chrome.
import type { ContentDoc } from '@/types/content';

export interface ImageEntry { name: string; size: number; mtime: string }
export interface FontEntry  { name: string; family: string; url: string; size: number; mtime: string }

async function jsonOrThrow<T>(r: Response): Promise<T> {
  const body = await r.text();
  if (!r.ok) {
    try { throw new Error((JSON.parse(body).error ?? body) as string); }
    catch { throw new Error(body || r.statusText); }
  }
  return body ? (JSON.parse(body) as T) : ({} as T);
}

// Tries /api/content first. If that 404s (e.g. on Vercel), falls back to
// /content.json — a copy of the source of truth baked into dist/ at build
// time. The store treats a successful fallback as "static mode".
export async function getContent(): Promise<{ doc: ContentDoc; static: boolean }> {
  try {
    const doc = await jsonOrThrow<ContentDoc>(await fetch('/api/content', { cache: 'no-store' }));
    return { doc, static: false };
  } catch {
    const doc = await jsonOrThrow<ContentDoc>(await fetch('/content.json', { cache: 'no-store' }));
    return { doc, static: true };
  }
}

export async function putContent(doc: ContentDoc): Promise<void> {
  await jsonOrThrow(await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc, null, 2),
  }));
}

export async function listImages(): Promise<ImageEntry[]> {
  const r = await jsonOrThrow<{ images: ImageEntry[] }>(await fetch('/api/images'));
  return r.images ?? [];
}

export async function uploadImage(filename: string, dataUrl: string): Promise<string> {
  const r = await jsonOrThrow<{ url: string }>(await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, dataUrl }),
  }));
  return r.url;
}

export async function deleteImage(name: string): Promise<void> {
  await jsonOrThrow(await fetch(`/api/images/${encodeURIComponent(name)}`, { method: 'DELETE' }));
}

export async function listFonts(): Promise<FontEntry[]> {
  const r = await jsonOrThrow<{ fonts: FontEntry[] }>(await fetch('/api/fonts'));
  return r.fonts ?? [];
}

export async function uploadFont(filename: string, family: string, dataUrl: string): Promise<FontEntry> {
  return jsonOrThrow<FontEntry>(await fetch('/api/fonts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, family, dataUrl }),
  }));
}

export async function deleteFont(name: string): Promise<void> {
  await jsonOrThrow(await fetch(`/api/fonts/${encodeURIComponent(name)}`, { method: 'DELETE' }));
}
