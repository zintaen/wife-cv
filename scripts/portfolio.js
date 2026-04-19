/* =========================================================================
   Portfolio Studio — unified renderer + editor
   - Fetches/Saves content.json via /api/content
   - Renders each category using a type-specific template (multi-lang aware)
   - Sidebar drives: language, theme, theme-customizer, orientation,
     category list (reorder/add/delete), and per-section edit form
   - Any change to content or controls re-renders the preview live
   ========================================================================= */
(() => {

  // ============================================================== STATE
  const state = {
    content: null,
    originalSig: '',
    selectedId: null,
    lang: 'vi',
    theme: 'editorial',
    orientation: 'landscape',
    images: [],                  // [{name, size, mtime}]
    pickerContext: null,         // { set: fn(filename), multi: bool }
    themeOverrides: {},          // { [theme]: { '--accent': '#...', ... } }
    isStatic: false,             // true if /api/content not reachable
  };

  const LANGS = ['vi', 'en', 'zh'];
  const THEME_VARS = ['--accent', '--heading', '--page-bg', '--fg'];

  // ============================================================== HELPERS
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const esc = (s = '') =>
    String(s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const el = (tag, props = {}, ...kids) => {
    if (typeof tag === 'string' && tag.startsWith('<')) {
      const t = document.createElement('template');
      t.innerHTML = tag.trim();
      return t.content.firstElementChild;
    }
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k === 'style') Object.assign(n.style, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };

  // multi-lang text helper — returns best string for current lang
  function t(field, lang = state.lang) {
    if (field == null) return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field === 'object') {
      if (field[lang] && String(field[lang]).trim()) return String(field[lang]);
      if (field.vi) return String(field.vi);
      if (field.en) return String(field.en);
      if (field.zh) return String(field.zh);
    }
    return '';
  }

  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cat';
  const sig = v => JSON.stringify(v);

  // Return an object { vi, en, zh } no matter what was stored
  function toLangObj(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return { vi: v.vi || '', en: v.en || '', zh: v.zh || '' };
    }
    return { vi: v == null ? '' : String(v), en: '', zh: '' };
  }

  // ============================================================== TOAST
  let toastTimer;
  function toast(msg, kind = 'ok') {
    const node = $('#toast');
    node.className = `toast toast--${kind}`;
    node.textContent = msg;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2200);
  }

  function renderStatus() {
    const n = $('#status');
    if (state.isStatic) {
      n.textContent = 'Static mode (read-only)';
      n.className = 'status is-dirty';
      return;
    }
    const dirty = sig(state.content) !== state.originalSig;
    if (dirty) { n.textContent = 'Unsaved changes'; n.className = 'status is-dirty'; }
    else { n.textContent = 'All changes saved'; n.className = 'status is-saved'; }
  }

  // ============================================================== API
  async function fetchJson(url, opts = {}) {
    const r = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    const txt = await r.text();
    let body;
    try { body = txt ? JSON.parse(txt) : {}; } catch { throw new Error(`Bad JSON from ${url}: ${txt.slice(0,120)}`); }
    if (!r.ok) throw new Error(body.error || r.statusText);
    return body;
  }

  async function loadContent() {
    try {
      state.content = await fetchJson('/api/content');
      state.isStatic = false;
    } catch {
      // fallback: static mode
      try {
        const r = await fetch('content.json', { cache: 'no-cache' });
        state.content = await r.json();
        state.isStatic = true;
      } catch (err) {
        $('#portfolio').innerHTML = `<div class="loading" style="color:#c0392b">Could not load content.json — run the Node server (<code>node server.js</code>) from this folder.</div>`;
        throw err;
      }
    }
    state.originalSig = sig(state.content);

    // pull defaults from meta
    const meta = state.content.meta || {};
    state.lang        = meta.default_lang        || 'vi';
    state.theme       = meta.default_theme       || 'editorial';
    state.orientation = meta.default_orientation || 'landscape';
    state.themeOverrides = meta.theme_overrides || {};
    applyMetaToControls();
  }

  async function loadImages() {
    try {
      const r = await fetchJson('/api/images');
      state.images = r.images || [];
    } catch {
      state.images = [];
    }
  }

  async function saveContent() {
    if (state.isStatic) { toast('Run node server.js to save edits', 'err'); return; }
    try {
      await fetchJson('/api/content', { method: 'PUT', body: JSON.stringify(state.content) });
      state.originalSig = sig(state.content);
      renderStatus();
      toast('Saved to disk');
    } catch (e) {
      toast('Save failed: ' + e.message, 'err');
    }
  }

  async function uploadImage(file) {
    const dataUrl = await new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(r.result); r.onerror = no;
      r.readAsDataURL(file);
    });
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
    return fetchJson('/api/images', {
      method: 'POST',
      body: JSON.stringify({ filename: safeName, dataUrl }),
    });
  }
  const deleteImage = name => fetchJson(`/api/images/${encodeURIComponent(name)}`, { method: 'DELETE' });

  // ============================================================== PREVIEW
  function makePage(type, { title } = {}) {
    const page = document.createElement('section');
    page.className = 'page';
    page.dataset.type = type;
    page.innerHTML = `<div class="page__body"></div><footer class="page__footer"></footer>`;
    if (title) page.dataset.title = title;
    return page;
  }

  function renderHead(title, subtitle) {
    const parts = (title || '').split(' ');
    const first = parts.shift() || '';
    const rest = parts.join(' ');
    return `
      <header class="section-head">
        <div class="section-head__eyebrow">${esc(subtitle || '')}</div>
        <h2 class="section-head__title">${esc(first)}${rest ? ` <em>${esc(rest)}</em>` : ''}</h2>
        <div class="section-head__rule"></div>
      </header>`;
  }

  const templates = {
    cover(d) {
      const page = makePage('cover');
      page.classList.add('page--cover');
      const roles = (d.roles || []).map(r => t(r));
      page.querySelector('.page__body').innerHTML = `
        <div class="cover">
          <div class="cover__left">
            <div class="cover__kicker">${esc(roles.join(' · '))}</div>
            <div class="cover__name-frame">${esc(t(d.portfolio_label))}</div>
            <div class="cover__stage-name">${esc(t(d.name))}</div>
            <div class="cover__roles">${roles.map(r => `<span>${esc(r)}</span>`).join('')}</div>
          </div>
          <div class="cover__right">
            <img class="cover__img" src="${esc(d.image || '')}" alt="" />
          </div>
        </div>`;
      return [page];
    },

    about(d) {
      return (d.sections || []).map(s => {
        const page = makePage('about', { title: t(d.heading) });
        page.querySelector('.page__body').innerHTML = `
          ${renderHead(t(d.heading), t(d.subheading))}
          <div class="about">
            <div class="about__text">
              <p><span class="about__drop">${esc((t(s.body) || '').trim()[0] || '')}</span>${esc((t(s.body) || '').trim().slice(1))}</p>
            </div>
            <div class="about__photo"><img src="${esc(s.image || '')}" alt="" /></div>
          </div>`;
        return page;
      });
    },

    'personal-info'(d) {
      const page = makePage('personal');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="info">
          <div class="info__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="info__fields">
            ${(d.fields || []).map(f => `
              <div class="field-row">
                <div class="field-row__label">${esc(t(f.label))}</div>
                <div class="field-row__value">${esc(t(f.value))}</div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    'body-info'(d) {
      const page = makePage('body');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="info">
          <div class="info__photos">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="info__fields">
            ${(d.fields || []).map(f => `
              <div class="field-row">
                <div class="field-row__label">${esc(t(f.label))}</div>
                <div class="field-row__value">${esc(t(f.value))}</div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    training(d) {
      const page = makePage('training');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="training">
          <div class="training__list">
            ${(d.programs || []).map((p, i) => `
              <div class="training__item">
                <div class="training__num">${String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div class="training__title">${esc(t(p.title))}</div>
                  <div class="training__inst">${esc(t(p.institution))}</div>
                </div>
              </div>`).join('')}
          </div>
          <div class="training__photos">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    abilities(d) {
      const page = makePage('abilities');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="abilities">
          <div class="abilities__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="abilities__grid">
            ${(d.skills || []).map(s => {
              const label = t(s.name || { vi: s.vi, en: s.en, zh: s.zh });
              const en = (s.name && s.name.en) || s.en || '';
              return `
              <div class="skill">
                <div class="skill__ring" style="--pct:${s.percent}">
                  <div class="skill__pct">${s.percent}%</div>
                </div>
                <div class="skill__name">${esc(label)}</div>
                ${en && en !== label ? `<div class="skill__en">— ${esc(en)}</div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`;
      return [page];
    },

    'experiences-gallery'(d) {
      const plays = d.plays || [];
      const featured = plays.slice(0, 2);
      const rest = plays.slice(2);
      const pages = [];

      const pageA = makePage('theatre', { title: t(d.heading) });
      pageA.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="gallery">
          <p class="gallery__intro">${esc(t(d.intro))}</p>
          <div class="featured-plays">
            ${featured.map(p => `
              <div class="featured-play">
                <div class="featured-play__img"><img src="${esc(p.image || '')}" alt="" /></div>
                <div class="featured-play__meta">
                  <div class="featured-play__name">${esc(t(p.name))}</div>
                  <div class="featured-play__role">${labelForRole()} ${esc(t(p.role))}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
      pages.push(pageA);

      if (rest.length) {
        const pageB = makePage('theatre', { title: t(d.heading) });
        pageB.querySelector('.page__body').innerHTML = `
          ${renderHead(t(d.heading), t(d.subheading))}
          <div class="gallery">
            <div class="plays-grid">
              ${rest.map(p => `
                <div class="play-card">
                  <div class="play-card__img"><img src="${esc(p.image || '')}" alt="" /></div>
                  <div class="play-card__cap">
                    <div class="play-card__name">${esc(t(p.name))}</div>
                    <div class="play-card__role">${labelForRole()} ${esc(t(p.role))}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
        pages.push(pageB);
      }
      return pages;
    },

    'experiences-tv'(d) {
      const page = makePage('tv');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="tv">
          <div class="tv__grid">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="tv__copy">
            <p>${esc(t(d.intro))}</p>
            <ul class="tv__shows">
              ${(d.shows || []).map(s => `<li>${esc(t(s))}</li>`).join('')}
            </ul>
          </div>
        </div>`;
      return [page];
    },

    'film-categories'(d) {
      const page = makePage('film');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="film">
          <div class="film__gallery">
            ${(d.images || []).slice(0, 9).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="film__cats">
            ${(d.categories || []).map(c => `
              <div class="film__cat">
                <div class="film__icon">${esc(c.icon || '')}</div>
                <div>
                  <div class="film__ctitle">${esc(t(c.title))}</div>
                  <div class="film__works">${esc((c.works || []).map(w => t(w)).join(', '))}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    media(d) {
      const page = makePage('media');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="media-grid">
          ${(d.mentions || []).map(m => `
            <div class="media-card">
              <div class="media-card__poster"><img src="${esc(m.poster || '')}" alt="" /></div>
              <div class="media-card__body">
                <div class="media-card__play">${esc(t(m.play))}</div>
                <div class="media-card__links">
                  ${(m.links || []).map(l => `<a class="media-card__link" href="${esc(l)}" target="_blank" rel="noopener">${esc(String(l).replace(/^https?:\/\//, ''))}</a>`).join('')}
                </div>
              </div>
            </div>`).join('')}
        </div>`;
      return [page];
    },

    contact(d) {
      const page = makePage('contact');
      const icon = name => ({
        phone:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        facebook: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h3l1-4h-4V7c0-1.2.4-2 2-2h2V1.5C16 1.2 14.8 1 13.3 1 10.5 1 9 2.7 9 5.8V10H5v4h4v8h4z"/></svg>`,
        email:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
        tiktok:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.3c1 1 2.5 1.7 4 1.7v3a8 8 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z"/></svg>`,
        instagram:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        youtube:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C17.1 3.4 12 3.4 12 3.4s-5.1 0-8.1.3c-.4 0-1.3.1-2.1 1C1.2 5.4 1 7 1 7s-.2 1.8-.2 3.7v1.8c0 1.9.2 3.7.2 3.7s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.8.3 7.8.3s5.1 0 8.1-.3c.4 0 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.8.2-3.7v-1.8c0-1.9-.2-3.7-.2-3.7zM9.7 15V7.9l6.4 3.6-6.4 3.6z"/></svg>`,
      }[name] || '');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="contact">
          <div class="contact__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="contact__list">
            ${(d.entries || []).map(e => `
              <a class="contact__row" href="${esc(e.href || '#')}" target="_blank" rel="noopener">
                <div class="contact__icon">${icon(e.icon)}</div>
                <div>
                  <div class="contact__label">${esc(t(e.label))}</div>
                  <div class="contact__value">${esc(t(e.value))}</div>
                </div>
              </a>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    thankyou(d) {
      const page = makePage('thankyou');
      page.classList.add('page--thankyou');
      const title = (t(d.heading) || 'THANK YOU').split(' ');
      const first = title[0];
      const rest  = title.slice(1).join(' ');
      page.querySelector('.page__body').innerHTML = `
        <div class="thankyou">
          ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          <div class="thankyou__overlay">
            <div class="thankyou__title">${esc(first)}${rest ? `<em>${esc(rest)}</em>` : ''}</div>
            <div class="thankyou__sub">${esc(t(d.subheading))}</div>
          </div>
        </div>`;
      return [page];
    },
  };

  function labelForRole() {
    return { vi: 'trong vai', en: 'as', zh: '饰' }[state.lang] || 'as';
  }

  function renderPreview() {
    const root = $('#portfolio');
    root.setAttribute('aria-busy', 'false');
    root.innerHTML = '';

    const allPages = [];
    for (const cat of state.content.categories) {
      const tpl = templates[cat.type];
      if (!tpl) { console.warn('no template for type', cat.type); continue; }
      const pages = tpl(cat.data || {}, cat) || [];
      pages.forEach((p, i) => {
        p.dataset.catId = cat.id;
        p.dataset.pageIndex = i + 1;
        p.dataset.pagesInCat = pages.length;
        if (cat.id === state.selectedId) p.style.outline = '3px solid rgba(217,176,121,.4)';
        allPages.push(p);
        root.appendChild(p);
      });
    }
    allPages.forEach((p, i) => {
      const footer = p.querySelector('.page__footer');
      if (footer) footer.dataset.page = String(i + 1).padStart(2, '0');
    });
  }

  // ============================================================== CONTROLS BINDING
  function applyMetaToControls() {
    document.body.dataset.theme = state.theme;
    document.body.dataset.orientation = state.orientation;

    $$('#lang-chips .chip').forEach(c =>
      c.classList.toggle('is-active', c.dataset.lang === state.lang));
    $$('#theme-chips .theme-chip').forEach(c => {
      c.classList.toggle('is-active', c.dataset.theme === state.theme);
      c.setAttribute('aria-checked', c.dataset.theme === state.theme ? 'true' : 'false');
    });
    $$('.segmented__btn').forEach(c => {
      c.classList.toggle('is-active', c.dataset.orientation === state.orientation);
      c.setAttribute('aria-checked', c.dataset.orientation === state.orientation ? 'true' : 'false');
    });
    applyThemeOverrides();
    syncColorPickers();
    updatePrintPageRule();
  }

  function applyThemeOverrides() {
    // Wipe any previous inline overrides
    THEME_VARS.forEach(v => document.body.style.removeProperty(v));
    const ov = state.themeOverrides[state.theme] || {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) document.body.style.setProperty(k, v);
    }
  }

  function syncColorPickers() {
    const cs = getComputedStyle(document.body);
    $$('#theme-editor input[type="color"]').forEach(input => {
      const varName = input.dataset.var;
      const ov = (state.themeOverrides[state.theme] || {})[varName];
      const val = ov || cs.getPropertyValue(varName).trim();
      input.value = toHex(val) || '#000000';
    });
  }

  function toHex(color) {
    if (!color) return '';
    color = color.trim();
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      if (color.length === 4) {
        return '#' + color.slice(1).split('').map(c => c + c).join('');
      }
      return color;
    }
    // convert rgb()
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b] = m[1].split(',').map(s => parseInt(s.trim(), 10));
      return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
    }
    return '';
  }

  function updatePrintPageRule() {
    let style = document.getElementById('print-page-size');
    if (!style) {
      style = document.createElement('style');
      style.id = 'print-page-size';
      document.head.appendChild(style);
    }
    style.textContent = `@media print { @page { size: A4 ${state.orientation}; margin: 0; } }`;
  }

  // ============================================================== SIDEBAR: CAT LIST
  function renderCatList() {
    const host = $('#cat-list');
    host.innerHTML = '';
    (state.content.categories || []).forEach(cat => {
      const item = el('div', {
        class: 'cat-item' + (cat.id === state.selectedId ? ' is-active' : ''),
        draggable: 'true',
        dataset: { id: cat.id },
        onclick: () => selectCat(cat.id),
      });
      item.append(
        el('span', { class: 'cat-item__handle' }, '⋮⋮'),
        el('div', { class: 'cat-item__title', title: t(cat.data?.heading || cat.data?.portfolio_label || cat.id) },
          t(cat.data?.heading || cat.data?.portfolio_label || cat.id) || cat.id),
        el('span', { class: 'cat-item__type' }, cat.type),
      );
      // drag-and-drop reorder
      item.addEventListener('dragstart', e => {
        item.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', cat.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => item.classList.remove('is-dragging'));
      item.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      item.addEventListener('drop', e => {
        e.preventDefault();
        const srcId = e.dataTransfer.getData('text/plain');
        if (!srcId || srcId === cat.id) return;
        const arr = state.content.categories;
        const from = arr.findIndex(c => c.id === srcId);
        const to   = arr.findIndex(c => c.id === cat.id);
        if (from < 0 || to < 0) return;
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        dirty();
        renderCatList();
        renderPreview();
      });

      host.appendChild(item);
    });
  }

  function selectCat(id) {
    state.selectedId = id;
    renderCatList();
    renderPreview();
    renderEditor();
    // scroll first page of cat into view
    const target = $(`.page[data-cat-id="${CSS.escape(id)}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================== EDITOR (merged admin)
  function dirty() {
    renderStatus();
    renderPreview();
  }

  function renderEditor() {
    const host = $('#editor');
    host.innerHTML = '';
    const cat = state.content.categories.find(c => c.id === state.selectedId);
    if (!cat) {
      host.append(el('div', { class: 'editor__empty' }, 'Pick a section above to edit its content. Changes preview live.'));
      return;
    }

    // Header card
    const head = el('div', { class: 'card' });
    head.append(
      el('div', { class: 'card__title' },
        el('span', { class: 'dot' }),
        cat.type,
      ),
      fieldRow('ID', el('input', {
        class: 'input',
        value: cat.id,
        onchange: e => {
          const v = slug(e.target.value);
          if (!v || state.content.categories.some(c => c !== cat && c.id === v)) {
            e.target.value = cat.id;
            return;
          }
          cat.id = v;
          state.selectedId = v;
          renderCatList();
          dirty();
        },
      })),
    );
    host.append(head);

    // Type-specific editor
    const builder = editors[cat.type];
    if (builder) {
      const nodes = builder(cat.data || (cat.data = {}));
      (Array.isArray(nodes) ? nodes : [nodes]).forEach(n => host.append(n));
    } else {
      host.append(el('div', { class: 'editor__empty' }, `No editor for type "${cat.type}".`));
    }

    // Danger zone
    const dz = el('div', { class: 'danger-zone' });
    dz.append(
      el('span', {}, 'Delete this section'),
      el('button', {
        class: 'btn btn--danger btn--xs',
        onclick: () => {
          if (!confirm('Delete section "' + cat.id + '"?')) return;
          state.content.categories = state.content.categories.filter(c => c !== cat);
          state.selectedId = null;
          renderCatList(); renderEditor(); dirty();
        },
      }, 'Delete'),
    );
    host.append(dz);
  }

  // small layout helpers
  function fieldRow(label, input) {
    return el('div', { class: 'field' },
      el('label', { class: 'field__label' }, label),
      input,
    );
  }

  // Multi-lang text field (tabs for VI/EN/ZH)
  function langTextField(label, obj, onChange, { textarea = false } = {}) {
    const lo = toLangObj(obj);
    let activeLang = state.lang;
    const wrap = el('div', { class: 'field' });
    const head = el('label', { class: 'field__label' }, label);
    const tabs = el('div', { class: 'lang-tabs' });
    LANGS.forEach(lg => {
      const btn = el('button', {
        class: 'lang-tabs__btn' + (lg === activeLang ? ' is-active' : ''),
        onclick: e => { e.preventDefault(); activeLang = lg; refresh(); },
      }, lg.toUpperCase());
      tabs.append(btn);
    });
    head.append(tabs);
    wrap.append(head);

    let input;
    const refresh = () => {
      tabs.querySelectorAll('.lang-tabs__btn').forEach((b, i) =>
        b.classList.toggle('is-active', LANGS[i] === activeLang));
      if (input) input.value = lo[activeLang] || '';
    };
    const props = {
      class: 'input',
      value: lo[activeLang] || '',
      oninput: e => { lo[activeLang] = e.target.value; onChange(lo); dirty(); },
    };
    input = textarea ? el('textarea', props) : el('input', props);
    wrap.append(input);
    refresh();
    return wrap;
  }

  function textField(label, val, onChange) {
    return fieldRow(label, el('input', {
      class: 'input', value: val || '',
      oninput: e => { onChange(e.target.value); dirty(); },
    }));
  }

  function numField(label, val, onChange) {
    return fieldRow(label, el('input', {
      class: 'input', type: 'number', value: val ?? 0,
      oninput: e => { onChange(Number(e.target.value)); dirty(); },
    }));
  }

  function imgField(label, val, onChange) {
    const wrap = el('div', { class: 'field' });
    wrap.append(el('label', { class: 'field__label' }, label));
    const grid = el('div', { class: 'img-field' });
    const preview = el('div', { class: 'img-field__preview' });
    const refreshPreview = () => {
      preview.innerHTML = val ? `<img src="${esc(val)}" alt="" />` : 'no image';
    };
    refreshPreview();
    const ctrls = el('div', { class: 'img-field__ctrls' });
    const pathIn = el('input', {
      class: 'input', value: val || '', placeholder: 'images/…',
      oninput: e => { val = e.target.value; onChange(val); refreshPreview(); dirty(); },
    });
    ctrls.append(
      pathIn,
      el('button', {
        class: 'btn btn--xs',
        onclick: () => openPicker({ set: name => {
          val = 'images/' + name;
          pathIn.value = val;
          onChange(val);
          refreshPreview();
          dirty();
        }}),
      }, 'Choose image'),
    );
    grid.append(preview, ctrls);
    wrap.append(grid);
    return wrap;
  }

  function imgListField(label, arr, { onChange } = {}) {
    const wrap = el('div', { class: 'field' });
    wrap.append(el('label', { class: 'field__label' }, label));
    const list = el('div', { class: 'img-list' });
    const rebuild = () => {
      list.innerHTML = '';
      arr.forEach((src, i) => {
        const item = el('div', { class: 'img-list__item' });
        item.innerHTML = `<img src="${esc(src)}" alt="" />`;
        const btn = el('button', {
          onclick: () => { arr.splice(i, 1); rebuild(); onChange && onChange(arr); dirty(); },
        }, '×');
        item.append(btn);
        list.append(item);
      });
      const add = el('button', {
        class: 'img-list__add',
        onclick: () => openPicker({
          multi: true,
          set: names => {
            names.forEach(n => arr.push('images/' + n));
            rebuild(); onChange && onChange(arr); dirty();
          },
        }),
      }, '+ add');
      list.append(add);
    };
    rebuild();
    wrap.append(list);
    return wrap;
  }

  // Multi-lang item list (programs, skills, plays, shows, etc.)
  function objListField(label, arr, build, makeEmpty) {
    const wrap = el('div', { class: 'card' });
    wrap.append(el('div', { class: 'card__title' },
      el('span', {}, label),
      el('button', {
        class: 'btn--xs',
        onclick: () => { arr.push(makeEmpty()); rebuild(); dirty(); },
      }, '+ add'),
    ));
    const host = el('div', { class: 'items' });

    const rebuild = () => {
      host.innerHTML = '';
      arr.forEach((it, i) => {
        const card = el('div', { class: 'item' });
        card.append(el('div', { class: 'item__bar' },
          el('span', { class: 'item__handle' }, '⋮⋮'),
          el('span', { class: 'item__badge' }, '#' + (i + 1)),
          el('div', { class: 'item__actions' },
            el('button', {
              class: 'btn--xs', disabled: i === 0,
              onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); rebuild(); dirty(); },
            }, '↑'),
            el('button', {
              class: 'btn--xs', disabled: i === arr.length - 1,
              onclick: () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); rebuild(); dirty(); },
            }, '↓'),
            el('button', {
              class: 'btn--xs',
              onclick: () => { arr.splice(i, 1); rebuild(); dirty(); },
            }, '×'),
          ),
        ));
        build(card, it, i);
        host.append(card);
      });
    };
    rebuild();
    wrap.append(host);
    return wrap;
  }

  // ============================================================== TYPE EDITORS
  const editors = {
    cover(d) {
      d.roles = d.roles || [];
      const nodes = [];
      const meta = state.content.meta || (state.content.meta = {});
      meta.name = toLangObj(meta.name);
      const metaCard = el('div', { class: 'card' });
      metaCard.append(
        el('div', { class: 'card__title' }, 'Artist'),
        langTextField('Stage name', meta.name, v => { state.content.meta.name = v; }),
        textField('Real name', meta.real_name, v => state.content.meta.real_name = v),
      );
      nodes.push(metaCard);

      const coverCard = el('div', { class: 'card' });
      coverCard.append(
        el('div', { class: 'card__title' }, 'Cover'),
        langTextField('Portfolio label', (d.portfolio_label = toLangObj(d.portfolio_label)),
          v => d.portfolio_label = v),
        langTextField('Display name', (d.name = toLangObj(d.name)), v => d.name = v),
        imgField('Cover image', d.image, v => d.image = v),
      );
      nodes.push(coverCard);

      const rolesList = objListField('Roles', d.roles,
        (card, role) => {
          role = d.roles[d.roles.indexOf(role)]; // keep ref
          d.roles[d.roles.indexOf(role)] = toLangObj(role);
          const ref = d.roles[d.roles.indexOf(role)];
          card.append(langTextField('Role', ref, v => {
            const idx = d.roles.indexOf(ref);
            d.roles[idx] = v;
          }));
        },
        () => ({ vi: '', en: '', zh: '' }),
      );
      nodes.push(rolesList);
      return nodes;
    },

    about(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'About'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.sections = d.sections || [];
      nodes.push(objListField('Sections', d.sections,
        (card, s) => {
          s.body = toLangObj(s.body);
          card.append(
            langTextField('Body', s.body, v => s.body = v, { textarea: true }),
            imgField('Image', s.image, v => s.image = v),
          );
        },
        () => ({ body: { vi: '', en: '', zh: '' }, image: '' }),
      ));
      return nodes;
    },

    'personal-info': infoEditor,
    'body-info':     bodyInfoEditor,

    training(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Training'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.programs = d.programs || [];
      nodes.push(objListField('Programs', d.programs,
        (card, p) => {
          p.title = toLangObj(p.title);
          p.institution = toLangObj(p.institution);
          card.append(
            langTextField('Title', p.title, v => p.title = v),
            langTextField('Institution', p.institution, v => p.institution = v),
          );
        },
        () => ({ title: { vi: '', en: '', zh: '' }, institution: { vi: '', en: '', zh: '' } }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, 'Photos'),
        imgListField('Training photos', d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    abilities(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Abilities'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        imgField('Hero image', d.image, v => d.image = v),
      );
      nodes.push(head);
      d.skills = d.skills || [];
      nodes.push(objListField('Skills', d.skills,
        (card, s) => {
          s.name = toLangObj(s.name || { vi: s.vi, en: s.en, zh: s.zh });
          // clean up legacy keys
          delete s.vi; delete s.en; delete s.zh;
          card.append(
            langTextField('Skill name', s.name, v => s.name = v),
            numField('Percent', s.percent, v => s.percent = Math.max(0, Math.min(100, v))),
          );
        },
        () => ({ name: { vi: '', en: '', zh: '' }, percent: 50 }),
      ));
      return nodes;
    },

    'experiences-gallery'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Theatre gallery'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        langTextField('Intro', (d.intro = toLangObj(d.intro)), v => d.intro = v, { textarea: true }),
      );
      nodes.push(head);
      d.plays = d.plays || [];
      nodes.push(objListField('Plays', d.plays,
        (card, p) => {
          p.name = toLangObj(p.name);
          p.role = toLangObj(p.role);
          card.append(
            langTextField('Play name', p.name, v => p.name = v),
            langTextField('Role', p.role, v => p.role = v),
            imgField('Image', p.image, v => p.image = v),
          );
        },
        () => ({ name: { vi: '', en: '', zh: '' }, role: { vi: '', en: '', zh: '' }, image: '' }),
      ));
      return nodes;
    },

    'experiences-tv'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'TV dramas'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        langTextField('Intro', (d.intro = toLangObj(d.intro)), v => d.intro = v, { textarea: true }),
      );
      nodes.push(head);
      d.shows = d.shows || [];
      nodes.push(objListField('Shows', d.shows,
        (card, s, i) => {
          const ref = toLangObj(s);
          d.shows[i] = ref;
          card.append(langTextField('Show name', ref, v => d.shows[d.shows.indexOf(ref)] = v));
        },
        () => ({ vi: '', en: '', zh: '' }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, 'Photos'),
        imgListField('TV photos', d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    'film-categories'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Film'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.categories = d.categories || [];
      nodes.push(objListField('Categories', d.categories,
        (card, c) => {
          c.title = toLangObj(c.title);
          c.works = c.works || [];
          card.append(
            textField('Icon (emoji)', c.icon, v => c.icon = v),
            langTextField('Category title', c.title, v => c.title = v),
          );
          const worksList = objListField('Works', c.works,
            (wc, w, i) => {
              const ref = toLangObj(w);
              c.works[i] = ref;
              wc.append(langTextField('Work', ref, v => c.works[c.works.indexOf(ref)] = v));
            },
            () => ({ vi: '', en: '', zh: '' }),
          );
          card.append(worksList);
        },
        () => ({ icon: '🎬', title: { vi: '', en: '', zh: '' }, works: [] }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, 'Photos'),
        imgListField('Film stills', d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    media(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Press & Media'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.mentions = d.mentions || [];
      nodes.push(objListField('Mentions', d.mentions,
        (card, m) => {
          m.play = toLangObj(m.play);
          m.links = m.links || [];
          card.append(
            langTextField('Play', m.play, v => m.play = v),
            imgField('Poster', m.poster, v => m.poster = v),
          );
          const linksCard = el('div', { class: 'card' });
          linksCard.append(el('div', { class: 'card__title' },
            el('span', {}, 'Links'),
            el('button', { class: 'btn--xs', onclick: () => { m.links.push(''); renderEditor(); dirty(); } }, '+ add'),
          ));
          const listEl = el('div', { class: 'strlist' });
          m.links.forEach((lk, i) => {
            const row = el('div', { class: 'strlist__row' });
            row.append(
              el('input', {
                class: 'input', value: lk, placeholder: 'https://…',
                oninput: e => { m.links[i] = e.target.value; dirty(); },
              }),
              el('button', {
                class: 'btn--xs btn--danger',
                onclick: () => { m.links.splice(i, 1); renderEditor(); dirty(); },
              }, '×'),
            );
            listEl.append(row);
          });
          linksCard.append(listEl);
          card.append(linksCard);
        },
        () => ({ play: { vi: '', en: '', zh: '' }, poster: '', links: [] }),
      ));
      return nodes;
    },

    contact(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Contact'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        imgField('Photo', d.image, v => d.image = v),
      );
      nodes.push(head);
      d.entries = d.entries || [];
      nodes.push(objListField('Entries', d.entries,
        (card, e) => {
          e.label = toLangObj(e.label);
          e.value = toLangObj(e.value);
          card.append(
            textField('Icon (phone / email / facebook / tiktok / instagram / youtube)',
              e.icon, v => e.icon = v),
            langTextField('Label', e.label, v => e.label = v),
            langTextField('Value', e.value, v => e.value = v),
            textField('Link (href)', e.href, v => e.href = v),
          );
        },
        () => ({ icon: 'email', label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' }, href: '' }),
      ));
      return nodes;
    },

    thankyou(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, 'Thank you'),
        langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, 'Photos'),
        imgListField('Photos', d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },
  };

  function infoEditor(d) {
    const nodes = [];
    const head = el('div', { class: 'card' });
    head.append(
      el('div', { class: 'card__title' }, 'Personal'),
      langTextField('Heading', (d.heading = toLangObj(d.heading)), v => d.heading = v),
      langTextField('Subheading', (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      imgField('Photo', d.image, v => d.image = v),
    );
    nodes.push(head);
    d.fields = d.fields || [];
    nodes.push(objListField('Fields', d.fields,
      (card, f) => {
        f.label = toLangObj(f.label || { vi: f.label_vi, en: f.label_en });
        f.value = toLangObj(f.value);
        delete f.label_vi; delete f.label_en;
        card.append(
          langTextField('Label', f.label, v => f.label = v),
          langTextField('Value', f.value, v => f.value = v),
        );
      },
      () => ({ label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' } }),
    ));
    return nodes;
  }

  function bodyInfoEditor(d) {
    const nodes = infoEditor(d);
    d.images = d.images || [];
    nodes.push(el('div', { class: 'card' },
      el('div', { class: 'card__title' }, 'Photos'),
      imgListField('Body photos', d.images, { onChange: v => d.images = v }),
    ));
    return nodes;
  }

  // ============================================================== IMAGE PICKER
  function openPicker(ctx) {
    state.pickerContext = ctx;
    loadImages().then(() => {
      renderPicker();
      $('#img-picker').hidden = false;
    });
  }
  function closePicker() {
    state.pickerContext = null;
    $('#img-picker').hidden = true;
  }
  function renderPicker() {
    const grid = $('#picker-grid');
    grid.innerHTML = '';
    if (!state.images.length) {
      grid.append(el('div', { class: 'editor__empty' },
        'No images yet. Upload some to begin.'));
    }
    state.images.forEach(img => {
      const card = el('div', { class: 'pick-card' });
      card.innerHTML = `<img src="images/${esc(img.name)}" alt=""/>
        <div class="pick-card__name">${esc(img.name)}</div>`;
      card.append(el('button', {
        class: 'pick-card__del',
        onclick: async e => {
          e.stopPropagation();
          if (!confirm('Delete ' + img.name + '?')) return;
          try { await deleteImage(img.name); } catch (err) { toast(err.message, 'err'); return; }
          await loadImages(); renderPicker();
        },
      }, '×'));
      card.onclick = () => {
        if (state.pickerContext?.multi) {
          state.pickerContext.set([img.name]);
          // keep open; user can add more and then close
        } else {
          state.pickerContext?.set?.(img.name);
          closePicker();
        }
      };
      grid.append(card);
    });
  }

  // ============================================================== WIRE UP
  function wireControls() {
    // language
    $$('#lang-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.lang = chip.dataset.lang;
        state.content.meta = state.content.meta || {};
        state.content.meta.default_lang = state.lang;
        applyMetaToControls();
        renderCatList();
        renderEditor();
        renderPreview();
        dirty();
      });
    });

    // theme
    $$('#theme-chips .theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.theme = chip.dataset.theme;
        state.content.meta = state.content.meta || {};
        state.content.meta.default_theme = state.theme;
        applyMetaToControls();
        dirty();
      });
    });

    // theme editor — color pickers
    $$('#theme-editor input[type="color"]').forEach(input => {
      input.addEventListener('input', () => {
        const varName = input.dataset.var;
        state.themeOverrides[state.theme] = state.themeOverrides[state.theme] || {};
        state.themeOverrides[state.theme][varName] = input.value;
        state.content.meta = state.content.meta || {};
        state.content.meta.theme_overrides = state.themeOverrides;
        document.body.style.setProperty(varName, input.value);
        dirty();
      });
    });
    $('#reset-theme-btn').addEventListener('click', () => {
      delete state.themeOverrides[state.theme];
      state.content.meta = state.content.meta || {};
      state.content.meta.theme_overrides = state.themeOverrides;
      applyThemeOverrides();
      syncColorPickers();
      dirty();
      toast('Theme colors reset');
    });

    // orientation
    $$('.segmented__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.orientation = btn.dataset.orientation;
        state.content.meta = state.content.meta || {};
        state.content.meta.default_orientation = state.orientation;
        applyMetaToControls();
        dirty();
      });
    });

    // save / print
    $('#save-btn').addEventListener('click', saveContent);
    $('#print-btn').addEventListener('click', () => window.print());

    // add category
    $('#add-cat-btn').addEventListener('click', () => {
      const type = prompt('Section type?\n(cover, about, personal-info, body-info, training, abilities, experiences-gallery, experiences-tv, film-categories, media, contact, thankyou)',
        'about');
      if (!type) return;
      if (!templates[type]) { toast('Unknown type: ' + type, 'err'); return; }
      const id = slug(prompt('Section id?', type) || type) || 'new';
      if (state.content.categories.some(c => c.id === id)) {
        toast('ID already in use', 'err'); return;
      }
      state.content.categories.push({ id, type, data: {} });
      state.selectedId = id;
      renderCatList(); renderEditor(); dirty();
    });

    // Image picker modal
    $('#img-picker-close').addEventListener('click', closePicker);
    $('#img-picker').addEventListener('click', e => {
      if (e.target.id === 'img-picker') closePicker();
    });
    $('#img-upload').addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      for (const f of files) {
        try { await uploadImage(f); }
        catch (err) { toast('Upload failed: ' + err.message, 'err'); }
      }
      toast(`Uploaded ${files.length} image(s)`);
      await loadImages();
      renderPicker();
    });

    // keyboard: ⌘/Ctrl+S
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
    });

    // warn on nav away w/ dirty
    window.addEventListener('beforeunload', e => {
      if (!state.isStatic && sig(state.content) !== state.originalSig) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  // ============================================================== BOOT
  async function init() {
    try {
      await loadContent();
      await loadImages();
    } catch (e) { console.error(e); return; }

    wireControls();
    renderCatList();
    renderEditor();
    renderPreview();
    renderStatus();
  }

  init();
})();
