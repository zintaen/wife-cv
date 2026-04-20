// Single export of the base component map. Vibes fall back to these when they
// don't override a type. Keeping this file tiny makes the registry easy to read.
import type { CategoryComponents } from '../types';

import { BaseCover }               from './Cover';
import { BaseAbout }               from './About';
import { BasePersonalInfo }        from './PersonalInfo';
import { BaseBodyInfo }            from './BodyInfo';
import { BaseTraining }            from './Training';
import { BaseAbilities }           from './Abilities';
import { BaseExperiencesGallery }  from './ExperiencesGallery';
import { BaseExperiencesTv }       from './ExperiencesTv';
import { BaseFilmCategories }      from './FilmCategories';
import { BaseMedia }               from './Media';
import { BaseContact }             from './Contact';
import { BaseThankYou }            from './ThankYou';

export const baseComponents: CategoryComponents = {
  'cover':                BaseCover,
  'about':                BaseAbout,
  'personal-info':        BasePersonalInfo,
  'body-info':            BaseBodyInfo,
  'training':             BaseTraining,
  'abilities':            BaseAbilities,
  'experiences-gallery':  BaseExperiencesGallery,
  'experiences-tv':       BaseExperiencesTv,
  'film-categories':      BaseFilmCategories,
  'media':                BaseMedia,
  'contact':              BaseContact,
  'thankyou':             BaseThankYou,
};
