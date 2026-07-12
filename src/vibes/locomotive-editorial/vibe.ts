// ============================================================================
// Locomotive Editorial — flagship vibe. Ivory + ink editorial aesthetic with
// viewport-fluid pages on screen (A4 is restored under @media print). Combines
// cinematic reveals, smooth scroll, shader-backed media, custom cursor, and a
// signature pinned horizontal gallery. This file just registers the vibe;
// the heavy lifting is in theme.css + the 12 component overrides below.
// ============================================================================
import './theme.css';
import type { VibeDef } from '../index';

import { LocoCover }              from './components/Cover';
import { LocoAbout }              from './components/About';
import { LocoPersonalInfo }       from './components/PersonalInfo';
import { LocoBodyInfo }           from './components/BodyInfo';
import { LocoTraining }           from './components/Training';
import { LocoAbilities }          from './components/Abilities';
import { LocoExperiencesGallery } from './components/ExperiencesGallery';
import { LocoExperiencesTv }      from './components/ExperiencesTv';
import { LocoFilmCategories }     from './components/FilmCategories';
import { LocoMedia }              from './components/Media';
import { LocoContact }            from './components/Contact';
import { LocoThankYou }           from './components/ThankYou';

const v: VibeDef = {
  key: 'locomotive-editorial',
  label: 'Locomotive Editorial',
  swatch: ['#F4EFE6', '#141311', '#A8623A', '#7A6F5E', '#E9E3D6'],
  suited: 'Cinematic · viewport-fluid · signature flagship',
  components: {
    'cover':                LocoCover,
    'about':                LocoAbout,
    'personal-info':        LocoPersonalInfo,
    'body-info':            LocoBodyInfo,
    'training':             LocoTraining,
    'abilities':            LocoAbilities,
    'experiences-gallery':  LocoExperiencesGallery,
    'experiences-tv':       LocoExperiencesTv,
    'film-categories':      LocoFilmCategories,
    'media':                LocoMedia,
    'contact':              LocoContact,
    'thankyou':             LocoThankYou,
  },
};
export default v;
