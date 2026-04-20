// Thin client for the Node server's /api/* endpoints.
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

export async function getContent(): Promise<ContentDoc> {
  return jsonOrThrow<ContentDoc>(await fetch('/api/content', { cache: 'no-store' }));
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
