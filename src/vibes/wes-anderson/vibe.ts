import './theme.css';
import type { VibeDef } from '../index';
import { CoverWes } from './Cover';
import { AboutWes } from './About';

const v: VibeDef = {
  key: 'wes-anderson',
  label: 'Wes Anderson',
  swatch: ['#F7E4D1', '#2A2520', '#F3C7B2', '#5B6F5B', '#A67458'],
  suited: 'Pastel precision · centered composition',
  components: {
    cover: CoverWes,
    about: AboutWes,
  },
};
export default v;
