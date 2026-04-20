import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function Toast() {
  const toast = useStore(s => s.toast);
  const hide  = useStore(s => s.hideToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, 2400);
    return () => clearTimeout(t);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: toast.kind === 'err' ? '#8C1F0C' : '#2E3A2A',
      color: '#F5EFE4',
      padding: '10px 16px',
      fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.04em',
      zIndex: 1000,
    }}>
      {toast.msg}
    </div>
  );
}
