// Map a category type to its editor component. Types without a dedicated
// form fall back to the JSON editor — still lets the user make changes.
import type { CategoryType } from '@/types/content';
import { CoverEditor }               from './CoverEditor';
import { AboutEditor }               from './AboutEditor';
import { PersonalInfoEditor }        from './PersonalInfoEditor';
import { BodyInfoEditor }            from './BodyInfoEditor';
import { TrainingEditor }            from './TrainingEditor';
import { AbilitiesEditor }           from './AbilitiesEditor';
import { ExperiencesGalleryEditor }  from './ExperiencesGalleryEditor';
import { ExperiencesTvEditor }       from './ExperiencesTvEditor';
import { FilmCategoriesEditor }      from './FilmCategoriesEditor';
import { MediaEditor }               from './MediaEditor';
import { ContactEditor }             from './ContactEditor';
import { ThankYouEditor }            from './ThankYouEditor';
import { JsonEditor }                from './JsonEditor';

type EditorComp = React.FC<{ cat: never }>;

const REGISTRY: Partial<Record<CategoryType, EditorComp>> = {
  'cover':                CoverEditor                as unknown as EditorComp,
  'about':                AboutEditor                as unknown as EditorComp,
  'personal-info':        PersonalInfoEditor         as unknown as EditorComp,
  'body-info':            BodyInfoEditor             as unknown as EditorComp,
  'training':             TrainingEditor             as unknown as EditorComp,
  'abilities':            AbilitiesEditor            as unknown as EditorComp,
  'experiences-gallery':  ExperiencesGalleryEditor   as unknown as EditorComp,
  'experiences-tv':       ExperiencesTvEditor        as unknown as EditorComp,
  'film-categories':      FilmCategoriesEditor       as unknown as EditorComp,
  'media':                MediaEditor                as unknown as EditorComp,
  'contact':              ContactEditor              as unknown as EditorComp,
  'thankyou':             ThankYouEditor             as unknown as EditorComp,
};

export function editorForType(type: CategoryType): EditorComp {
  return REGISTRY[type] ?? (JsonEditor as unknown as EditorComp);
}
