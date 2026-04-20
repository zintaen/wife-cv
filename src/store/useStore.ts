import { create } from 'zustand';
import type {
  Category, CategoryType, ContentDoc, Lang, Orientation, VibeKey,
} from '@/types/content';
import { VIBE_KEYS } from '@/types/content';
import * as api from '@/lib/api';

interface StoreState {
  // --- data
  content: ContentDoc | null;
  originalSig: string;
  isStatic: boolean;
  // --- ui
  lang: Lang;
  vibe: VibeKey;
  orientation: Orientation;
  selectedId: string | null;
  vibeOverrides: Partial<Record<VibeKey, Record<string, string>>>;
  // --- meta
  customFonts: { name: string; family: string; url: string }[];
  googleFonts: string[];
  toast: { msg: string; kind: 'ok' | 'err' } | null;

  // --- actions
  load:      () => Promise<void>;
  save:      () => Promise<void>;
  setLang:   (l: Lang) => void;
  setVibe:   (v: VibeKey) => void;
  setOrient: (o: Orientation) => void;
  select:    (id: string | null) => void;

  patchCategory: <T extends CategoryType>(id: string, patch: Partial<Category<T>['data']>) => void;
  replaceCategory: (id: string, next: Category) => void;
  addCategory:    (type: CategoryType) => void;
  deleteCategory: (id: string) => void;
  reorderCategory: (fromId: string, toId: string) => void;

  setVibeOverride: (vibe: VibeKey, varName: string, value: string) => void;
  resetVibeOverrides: (vibe: VibeKey) => void;

  showToast: (msg: string, kind?: 'ok' | 'err') => void;
  hideToast: () => void;
}

const sig = (o: unknown) => JSON.stringify(o);

export const useStore = create<StoreState>((set, get) => ({
  content: null,
  originalSig: '',
  isStatic: false,
  lang: 'vi',
  vibe: 'editorial',
  orientation: 'landscape',
  selectedId: null,
  vibeOverrides: {},
  customFonts: [],
  googleFonts: [],
  toast: null,

  async load() {
    try {
      const doc = await api.getContent();
      const meta = doc.meta ?? {} as ContentDoc['meta'];
      const vibe = (VIBE_KEYS as readonly string[]).includes(meta.default_theme as string)
        ? (meta.default_theme as VibeKey)
        : 'editorial';
      set({
        content: doc,
        originalSig: sig(doc),
        lang: (meta.default_lang ?? 'vi') as Lang,
        vibe,
        orientation: meta.default_orientation ?? 'landscape',
        vibeOverrides: meta.theme_overrides ?? {},
        isStatic: false,
      });
    } catch (e) {
      // Fall back to empty doc if server is unreachable (static hosting).
      console.warn('Content load failed, entering static mode:', e);
      set({ isStatic: true, content: { meta: {} as ContentDoc['meta'], categories: [] } });
    }
  },

  async save() {
    const { content, vibe, lang, orientation, vibeOverrides } = get();
    if (!content) return;
    const out: ContentDoc = {
      ...content,
      meta: {
        ...content.meta,
        default_lang: lang,
        default_theme: vibe,
        default_orientation: orientation,
        theme_overrides: vibeOverrides,
      },
    };
    try {
      await api.putContent(out);
      set({ content: out, originalSig: sig(out) });
      get().showToast('Saved', 'ok');
    } catch (e) {
      get().showToast((e as Error).message, 'err');
    }
  },

  setLang:   l  => set({ lang: l }),
  setVibe:   v  => set({ vibe: v }),
  setOrient: o  => set({ orientation: o }),
  select:    id => set({ selectedId: id }),

  patchCategory(id, patch) {
    const doc = get().content; if (!doc) return;
    const next: ContentDoc = {
      ...doc,
      categories: doc.categories.map(c =>
        c.id === id ? ({ ...c, data: { ...(c.data as object), ...(patch as object) } } as Category) : c
      ),
    };
    set({ content: next });
  },

  replaceCategory(id, replacement) {
    const doc = get().content; if (!doc) return;
    set({
      content: { ...doc, categories: doc.categories.map(c => (c.id === id ? replacement : c)) },
    });
  },

  addCategory(type) {
    const doc = get().content; if (!doc) return;
    const id = `${type}-${Date.now().toString(36)}`;
    const newCat = { id, type, data: blankDataForType(type) } as Category;
    set({ content: { ...doc, categories: [...doc.categories, newCat] }, selectedId: id });
  },

  deleteCategory(id) {
    const doc = get().content; if (!doc) return;
    set({
      content: { ...doc, categories: doc.categories.filter(c => c.id !== id) },
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  reorderCategory(fromId, toId) {
    const doc = get().content; if (!doc) return;
    const arr = [...doc.categories];
    const i = arr.findIndex(c => c.id === fromId);
    const j = arr.findIndex(c => c.id === toId);
    if (i < 0 || j < 0 || i === j) return;
    const [moved] = arr.splice(i, 1);
    arr.splice(j, 0, moved);
    set({ content: { ...doc, categories: arr } });
  },

  setVibeOverride(vibe, varName, value) {
    const ov = { ...get().vibeOverrides };
    ov[vibe] = { ...(ov[vibe] ?? {}), [varName]: value };
    set({ vibeOverrides: ov });
  },

  resetVibeOverrides(vibe) {
    const ov = { ...get().vibeOverrides };
    delete ov[vibe];
    set({ vibeOverrides: ov });
  },

  showToast(msg, kind = 'ok') { set({ toast: { msg, kind } }); },
  hideToast()                  { set({ toast: null }); },
}));

// ----------------------------------------------------- blank-factory
// Minimal defaults when the user adds a new section. Not meant to be pretty;
// just enough so the preview doesn't crash and the editor has something to
// edit. Forms fill the real copy.
function blankML() { return { vi: '', en: '', zh: '' }; }
function blankDataForType(type: CategoryType): unknown {
  switch (type) {
    case 'cover':               return { portfolio_label: blankML(), name: blankML(), roles: [], image: '' };
    case 'about':               return { heading: blankML(), subheading: blankML(), sections: [] };
    case 'personal-info':       return { heading: blankML(), subheading: blankML(), fields: [], image: '' };
    case 'body-info':           return { heading: blankML(), subheading: blankML(), fields: [], images: [] };
    case 'training':            return { heading: blankML(), subheading: blankML(), programs: [], images: [] };
    case 'abilities':           return { heading: blankML(), subheading: blankML(), skills: [], image: '' };
    case 'experiences-gallery': return { heading: blankML(), subheading: blankML(), intro: blankML(), plays: [] };
    case 'experiences-tv':      return { heading: blankML(), subheading: blankML(), intro: blankML(), shows: [], images: [] };
    case 'film-categories':     return { heading: blankML(), subheading: blankML(), categories: [], images: [] };
    case 'media':               return { heading: blankML(), subheading: blankML(), mentions: [] };
    case 'contact':              return { heading: blankML(), subheading: blankML(), entries: [], image: '' };
    case 'thankyou':            return { heading: blankML(), images: [] };
  }
}

// ----------------------------------------------------- dirty-selector
export const selectIsDirty = (s: StoreState) =>
  !s.isStatic && !!s.content && sig(s.content) !== s.originalSig;
