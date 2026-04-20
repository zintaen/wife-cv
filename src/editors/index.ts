// Map a category type to its editor component. Types without a dedicated
// form fall back to the JSON editor — still lets the user make changes.
import type { CategoryType } from '@/types/content';
import { CoverEditor }               from './CoverEditor';
import { AboutEditor }               from './AboutEditor';
import { TrainingEditor }            from './TrainingEditor';
import { ExperiencesGalleryEditor }  from './ExperiencesGalleryEditor';
import { JsonEditor }                from './JsonEditor';

type EditorComp = React.FC<{ cat: never }>;

const REGISTRY: Partial<Record<CategoryType, EditorComp>> = {
  'cover':                CoverEditor                as unknown as EditorComp,
  'about':                AboutEditor                as unknown as EditorComp,
  'training':             TrainingEditor             as unknown as EditorComp,
  'experiences-gallery':  ExperiencesGalleryEditor   as unknown as EditorComp,
};

export function editorForType(type: CategoryType): EditorComp {
  return REGISTRY[type] ?? (JsonEditor as unknown as EditorComp);
}
