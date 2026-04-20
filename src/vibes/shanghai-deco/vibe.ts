import './theme.css';
import type { VibeDef } from '../index';
import { CoverShanghai }  from './Cover';
import { AboutShanghai }  from './About';

const v: VibeDef = {
  key: 'shanghai-deco',
  label: 'Shanghai Deco',
  swatch: ['#F4E4BC', '#2C1810', '#A52A2A', '#D4A017', '#8B4513'],
  suited: '1930s chinoiserie · cinnabar & gold-leaf',
  components: {
    cover: CoverShanghai,
    about: AboutShanghai,
  },
};
export default v;
