// ============================================================================
// Vibe registry. Each vibe.ts imports its own theme.css and exports a default
// VibeDef. This index merges every vibe's (partial) component map with the
// base 12-component set so `pickComponent(vibe, type)` always resolves.
// ============================================================================
import type { VibeKey, CategoryType } from '@/types/content';
import type { CategoryComponent, CategoryComponents } from './types';
import { baseComponents } from './base/components';

// Active vibes — five others (locomotive-editorial, editorial, vogue-editorial,
// hanok-prestige, nouvelle-vague) are retired and intentionally NOT imported,
// so their CSS doesn't load and their bundles drop out of the build.
import cinemaNoir          from './cinema-noir/vibe';
import hongKongNeon        from './hong-kong-neon/vibe';
import shanghaiDeco        from './shanghai-deco/vibe';
import bollywoodMaximal    from './bollywood-maximal/vibe';
import japanesePhotobook   from './japanese-photobook/vibe';
import wesAnderson         from './wes-anderson/vibe';
import commercialFresh     from './commercial-fresh/vibe';

/**
 * A vibe is a named aesthetic preset. It owns its color/typography vars
 * (via theme.css), a human label, a "suited for" tagline surfaced in the
 * style dock, a 5-6 swatch preview, and an optional component override map.
 * Any category type NOT in `components` falls through to `baseComponents`.
 */
export interface VibeDef {
  key: VibeKey;
  label: string;
  swatch: string[];
  suited: string;
  components: Partial<CategoryComponents>;
}

export const VIBES: Record<VibeKey, VibeDef> = {
  'cinema-noir':          cinemaNoir,
  'hong-kong-neon':       hongKongNeon,
  'shanghai-deco':        shanghaiDeco,
  'bollywood-maximal':    bollywoodMaximal,
  'japanese-photobook':   japanesePhotobook,
  'wes-anderson':         wesAnderson,
  'commercial-fresh':     commercialFresh,
};

// Display order in the style dock. Cinema Noir leads as the default.
export const VIBE_ORDER: VibeKey[] = [
  'cinema-noir',
  'hong-kong-neon',
  'shanghai-deco',
  'bollywood-maximal',
  'japanese-photobook',
  'wes-anderson',
  'commercial-fresh',
];

/**
 * Resolve the component for a given vibe + category type. Always returns a
 * valid component — if the vibe doesn't override this type, the base
 * component is used.
 */
export function pickComponent<T extends CategoryType>(
  vibe: VibeKey,
  type: T,
): CategoryComponent<T> {
  const override = VIBES[vibe]?.components?.[type];
  return (override ?? baseComponents[type]) as CategoryComponent<T>;
}
