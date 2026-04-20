import './theme.css';
import type { VibeDef } from '../index';
import { CoverHongKong }  from './Cover';
import { AboutHongKong }  from './About';

const v: VibeDef = {
  key: 'hong-kong-neon',
  label: 'Hong Kong Neon',
  swatch: ['#0F0A14', '#F4E4BC', '#8C1F0C', '#2B1D3A', '#E85A3C', '#3F5E4A'],
  suited: 'Wong Kar-wai · humid rain-blurred night',
  components: {
    cover: CoverHongKong,
    about: AboutHongKong,
  },
};
export default v;
