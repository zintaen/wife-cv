// ============================================================================
// Content schema — mirrors content.json. This is the source-of-truth shape
// for every category. Per-vibe components consume these types; the registry
// type-checks component signatures against the category they render.
// ============================================================================

export type Lang = 'vi' | 'en' | 'zh';

/** Multilingual string. All user-facing copy in content.json uses this shape. */
export type MLStr = { vi: string; en: string; zh: string };

/** Accept a translated value OR a plain string (legacy/single-lang fallback). */
export type Localized = MLStr | string | undefined;

// ---------------------------------------------------------------- meta
export interface Meta {
  name: MLStr;
  real_name: string;
  tagline: MLStr;
  default_lang: Lang;
  default_theme: VibeKey;         // retained key name for backward compat
  default_orientation: Orientation;
  theme_overrides: Partial<Record<VibeKey, Record<string, string>>>;
}

export type Orientation = 'landscape' | 'portrait';

// ---------------------------------------------------------------- vibes
export const VIBE_KEYS = [
  'editorial',         // placeholder; remapped to vogue in v2
  'cinema-noir',
  'hong-kong-neon',
  'shanghai-deco',
  'bollywood-maximal',
  'hanok-prestige',
  'japanese-photobook',
  'nouvelle-vague',
  'wes-anderson',
  'vogue-editorial',
  'commercial-fresh',
] as const;
export type VibeKey = (typeof VIBE_KEYS)[number];

// ---------------------------------------------------------------- per-type data
export interface CoverData {
  portfolio_label: MLStr;
  name: MLStr;
  roles: MLStr[];
  image: string;
}

export interface AboutSection {
  body: MLStr;
  image: string;
}
export interface AboutData {
  heading: MLStr;
  subheading: MLStr;
  sections: AboutSection[];
}

export interface InfoField {
  label: MLStr;
  value: MLStr;
}
export interface PersonalInfoData {
  heading: MLStr;
  subheading: MLStr;
  fields: InfoField[];
  image: string;
}

export interface BodyInfoData {
  heading: MLStr;
  subheading: MLStr;
  fields: InfoField[];
  images: string[];
}

export interface TrainingProgram {
  title: MLStr;
  institution: MLStr;
}
export interface TrainingData {
  heading: MLStr;
  subheading: MLStr;
  programs: TrainingProgram[];
  images: string[];
}

export interface Skill {
  name: MLStr;
  percent: number;
}
export interface AbilitiesData {
  heading: MLStr;
  subheading: MLStr;
  skills: Skill[];
  image: string;
}

export interface Play {
  name: MLStr;
  role: MLStr;
  image: string;
}
export interface ExperiencesGalleryData {
  heading: MLStr;
  subheading: MLStr;
  intro: MLStr;
  plays: Play[];
  atmosphere_images?: string[];
}

export interface ExperiencesTvData {
  heading: MLStr;
  subheading: MLStr;
  intro: MLStr;
  shows: MLStr[];
  images: string[];
}

export interface FilmCategory {
  icon: string;
  title: MLStr;
  works: MLStr[];
}
export interface FilmCategoriesData {
  heading: MLStr;
  subheading: MLStr;
  categories: FilmCategory[];
  images: string[];
}

export interface MediaMention {
  play: MLStr;
  poster: string;
  links: string[];
}
export interface MediaData {
  heading: MLStr;
  subheading: MLStr;
  mentions: MediaMention[];
}

export type ContactIconKey =
  | 'phone' | 'email' | 'facebook' | 'tiktok' | 'instagram' | 'youtube';
export interface ContactEntry {
  icon: ContactIconKey;
  label: MLStr;
  value: MLStr;
  href: string;
}
export interface ContactData {
  heading: MLStr;
  subheading: MLStr;
  entries: ContactEntry[];
  image: string;
}

export interface ThankYouData {
  heading: MLStr;
  subheading?: MLStr;
  images: string[];
}

// ---------------------------------------------------------------- category union
export type CategoryType =
  | 'cover'
  | 'about'
  | 'personal-info'
  | 'body-info'
  | 'training'
  | 'abilities'
  | 'experiences-gallery'
  | 'experiences-tv'
  | 'film-categories'
  | 'media'
  | 'contact'
  | 'thankyou';

export type CategoryDataByType = {
  'cover':                CoverData;
  'about':                AboutData;
  'personal-info':        PersonalInfoData;
  'body-info':            BodyInfoData;
  'training':             TrainingData;
  'abilities':            AbilitiesData;
  'experiences-gallery':  ExperiencesGalleryData;
  'experiences-tv':       ExperiencesTvData;
  'film-categories':      FilmCategoriesData;
  'media':                MediaData;
  'contact':              ContactData;
  'thankyou':             ThankYouData;
};

export interface Category<T extends CategoryType = CategoryType> {
  id: string;
  type: T;
  data: CategoryDataByType[T];
}

export interface ContentDoc {
  meta: Meta;
  categories: Category[];
}
