// React entry. Boots the app into #root and imports the global base CSS which
// owns the chrome grid, .page metrics, @page rules, and print-media resets.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App';
import '@/styles/base.css';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found — check index.html');

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
