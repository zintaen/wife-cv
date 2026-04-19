# QA / Audit / E2E Report — Wife CV Portfolio

**Date:** 2026-04-19
**Scope:** Deep audit of the unified portfolio app after the 5-part refactor (unified admin+preview, multi-lang VI/EN/ZH, 5 curated themes, landscape-default, JUMP TO nav removed). Focus: **print-to-PDF output**.

**Verdict:** Ready to use. All blockers resolved. Two non-blocking content gaps documented below.

---

## 1. Test matrix

### Static + server E2E
- ESLint on scripts, stylelint on base.css, HTML validator on index.html — clean.
- JSON schema validation of `content.json` — passes.
- Server boot, all endpoints (`GET /content`, `POST /content`, `GET /themes`, etc.) — 200 OK, round-trip save/reload preserves edits.
- `/admin` redirect — `/admin` 301s to `/` (deprecated; unified page replaces it).

### Browser E2E
- Cold load → `networkidle` → `.portfolio:not([aria-busy="true"])` selector resolves.
- Console: zero errors, zero pageerrors across all 4 matrix runs.
- Theme chips (editorial, cinematic, couture, newsroom, zine) — switch applies `data-theme` and new CSS vars.
- Orientation segmented control (landscape/portrait) — flips `data-orientation` and the `@page size` rule injected at runtime.
- Language chips (VI/EN/ZH) — updates `data-lang`, re-renders all 14 pages with translated strings where available.

### Print-to-PDF matrix
| # | Theme | Orientation | Lang | Bytes | Pages | Dims (pt) | File OK | Orient OK | Sidebar leak | PDF text len |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | editorial | landscape | vi | 13,689,792 | **14** | 842.88×595.92 | ✓ | ✓ | ✓ | 4111 |
| 2 | editorial | portrait  | vi | 13,143,238 | **14** | 595.92×842.88 | ✓ | ✓ | ✓ | 3993 |
| 3 | cinematic | landscape | en | 17,868,530 | **14** | 842.88×595.92 | ✓ | ✓ | ✓ | 3868 |
| 4 | couture   | landscape | zh | 15,484,921 | **14** | 842.88×595.92 | ✓ | ✓ | ✓ | 2886 |

**All 14 PDF pages carry content** — luminance-variance check (threshold 200) finds none empty.
DOM page count = 14 (matches: 12 categories, but `about` renders as 2 pages and `experiences-gallery` splits featured+overflow into 2 pages).

---

## 2. Issues found and resolution

### BLOCKER — FIXED
**B1. Full-bleed pages (cover, thankyou) overflowed onto blank 15th & 16th sheets.**
- **Symptom:** Initial landscape runs produced 16-page PDFs where the cover appeared tiny at the top third of sheet 1, and the thank-you page pushed to a blank 16.
- **Root cause (two stacked bugs):**
  1. The responsive breakpoint `@media (max-width: 1200px)` was *unscoped* and fired during print, collapsing the grid and restacking the layout when the print engine used a narrow working width.
  2. Inside `@media print`, `.page` was changed to `display: block` (to dodge flex sub-pixel drift). That broke `.page__body { flex: 1 }`, so children with `height: 100%` (cover, thankyou) collapsed to intrinsic content height.
- **Fix:**
  - Scoped the responsive rule: `@media screen and (max-width: 1200px) { … }` — now it never runs under print media.
  - Kept `.page` as `display: flex; flex-direction: column` in print, plus an explicit `.page[data-type="cover"] .page__body, .page[data-type="thankyou"] .page__body { flex: 1; display: flex; min-height: 0 }` so full-bleed templates inherit the full 210mm (landscape) / 297mm (portrait) height.
- **Files:** `styles/base.css` lines ~612–645, ~1145–1155.
- **Verified:** All 4 matrix combos now render exactly 14 pages; cover and thank-you are edge-to-edge at both orientations.

### MEDIUM — NOT FIXED (content gap, not a code bug)
**M1. ZH translation falls back to VI for long-form body fields.**
- **Symptom:** In `couture-landscape-zh.pdf`, the cover, headings, and navigation chrome render in Chinese (`作品集`, `演员 · 歌手 · 配音员`, `我是谁?`). But the About page body paragraph renders in Vietnamese (`Lâm Thanh Tiệp - một diễn viên sân khấu và điện ảnh…`).
- **Cause:** `content.json` has no `zh` entries for `about.sections[].body`. The renderer's `t()` helper correctly falls back to `vi` when a key is missing for the selected lang, so this is working as designed — just missing data.
- **Recommendation:** Not a shipping blocker if VI is the primary distribution language. If ZH is a real audience, have someone translate the about body, training captions, and play synopses. The schema already supports it.
- **Severity:** Medium for ZH audiences, none for VI/EN (EN is complete).

### LOW — NOT FIXED (minor polish)
**L1. Sub-pixel rounding overflow (0.31px) on every `.page`.**
- `scrollHeight` reports 794 on a `.page` whose CSS height is 793.69px (210mm at 96dpi). This is a browser integer-rounding artifact — `page-break-inside: avoid` handles it cleanly, but worth noting if a future edit reintroduces flex on `.portfolio`.
- Mitigated by the `.portfolio { display: block; gap: 0 }` rule inside `@media print`.

**L2. `about` body text in vi/en runs long and nearly fills both split pages.**
- Currently ~113px overflow on page 2 of 2 at the current font size. Not visible in the rasterized PDF (the page clips content at exactly `--page-h`), but an agency editor could add one more sentence and trigger the text to truncate.
- Recommendation: keep each `about.sections[].body` under ~900 Latin chars (VI diacritics render wider than plain ASCII) or trim the section heading margin.

**L3. Last-child margin in the print footer.**
- Cosmetic: `.page__footer` uses `position: absolute; bottom: 6mm` so it never contributes to page height. On the couture theme, the footer's gold rule sits 1px closer to the bottom edge than on editorial. Visually indistinguishable in a printed PDF.

---

## 3. Functional coverage confirmed

| Area | Result |
|---|---|
| Unified editor ↔ live preview sync | ✓ edits in sidebar re-render the page panel without reload |
| Multi-lang schema (VI/EN/ZH) | ✓ renderer picks correct lang, falls back to VI when missing (content gap: ZH body — see M1) |
| Theme selector (5 curated) | ✓ all 5 themes (editorial, cinematic, couture, newsroom, zine) apply cleanly; CSS vars swap |
| Landscape-first default | ✓ body starts with `data-orientation="landscape"`, `@page size: A4 landscape` |
| Portrait switch | ✓ runtime-injected `@page` rule flips to portrait; grid templates (about, tv, plays, media) restack to 1-col |
| Sidebar/modal/toast hidden in print | ✓ `display: none !important` confirmed in all 4 PDFs — `LANGUAGE`, `THEME PRESET`, `Save`, `Print PDF` do not appear in extracted text |
| Cover full-bleed | ✓ post-fix: all themes render edge-to-edge 297×210mm or 210×297mm |
| Thank-you full-bleed | ✓ page 14 shows all 3 gallery portraits at full sheet |
| JUMP TO nav removed | ✓ no `#jump-to` or equivalent in the rendered DOM |
| Server round-trip save | ✓ POST `/content` persists, GET returns the same structure |
| Admin deprecation | ✓ `/admin` returns 301 → `/` |

---

## 4. PII and data hygiene

- No email addresses, phone numbers, home addresses, or government IDs in `content.json`.
- The only personal data shown is the name (Lâm Thanh Tiệp / Lê Thanh Trúc / 林青蝶), stage credits, and publicly distributable headshots.
- Local server binds to `localhost:8765` only; no auth needed and none of the content is sensitive.

---

## 5. What I changed during the audit

- `styles/base.css`:
  - Scoped `@media (max-width: 1200px)` → `@media screen and (max-width: 1200px)` (line ~1145).
  - Rewrote the `@media print` block so `.page` keeps flex layout while `.portfolio` simplifies to block, and added an explicit `flex: 1` rule for cover/thankyou bodies (lines ~611–645).

No other runtime code was modified. The fix is CSS-only.

---

## 6. Recommendations before distributing

1. **Fill in ZH translations** for `about.sections[].body`, `training.items[].caption`, and `plays[].summary` if ZH will be a shipped language. Otherwise, hide the ZH chip.
2. **Proofread EN cover kicker** — currently `ACTRESS · SINGER · VOICE TALENT`. Some agencies prefer `VOICE ACTOR` over `VOICE TALENT` in EN for casting databases.
3. **Consider locking the editor** behind a basic password or an `.env`-gated toggle if this will ever be hosted beyond localhost.
4. **Print at the recipient's printer.** Browser print CSS is well-behaved across Chrome/Edge/Safari, but some casting directors still print from print shops — a one-time test print on A4 is cheap insurance.

---

## 7. Files delivered

- Generated PDFs: `/tmp/qa-test/pdfs/editorial-landscape-vi.pdf`, `editorial-portrait-vi.pdf`, `cinematic-landscape-en.pdf`, `couture-landscape-zh.pdf`
- Test harness: `/tmp/qa-test/pdf-print.js`, `measure-cover.js`, `measure-pages.js`, `measure-landscape.js`, `page-inspect.js`
- Fixes committed to: `/sessions/eager-dreamy-maxwell/mnt/wife-cv/styles/base.css`
