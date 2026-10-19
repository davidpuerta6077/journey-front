import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import type { BlockData } from './types';
import { enviarAlHub, escucharHub } from './bridge';

// El editor monta cuando Bravo Hub le manda la página (codex:load); así el
// historial de deshacer arranca con los bloques guardados, no vacío.
const root = ReactDOM.createRoot(document.getElementById('root')!);
let montado = false;
escucharHub((msg) => {
  if (msg.tipo !== 'codex:load' || montado) return;
  montado = true;
  const bloques: BlockData[] = Array.isArray(msg.bloques) ? msg.bloques : [];
  root.render(
    <React.StrictMode>
      <App initialBlocks={bloques} />
    </React.StrictMode>
  );
});
enviarAlHub({ tipo: 'codex:ready' });
