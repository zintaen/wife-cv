import { Page } from './Page';
import css from './ThankYou.module.css';
import { t } from '@/lib/translate';
import type { CategoryComponent } from '../types';

export const BaseThankYou: CategoryComponent<'thankyou'> = ({ data, lang }) => {
  const title = t(data.heading, lang) || 'THANK YOU';
  const parts = title.split(' ');
  const first = parts[0];
  const rest  = parts.slice(1).join(' ');
  return (
    <Page type="thankyou">
      <div className={css.page}>
        {(data.images ?? []).slice(0, 6).map((src, i) => (
          <div key={i}><img src={src} alt="" /></div>
        ))}
        <div className={css.overlay}>
          {first}{rest ? <>&nbsp;<em>{rest}</em></> : null}
        </div>
      </div>
    </Page>
  );
};
