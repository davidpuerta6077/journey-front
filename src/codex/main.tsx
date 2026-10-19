import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import type { BlockData } from './types';
import { enviarAlHub, escucharHub, aplicarTema } from './bridge';

// El editor monta cuando Bravo Hub le manda la página (codex:load); así el
// historial de deshacer arranca con los bloques guardados, no vacío.
const root = ReactDOM.createRoot(document.getElementById('root')!);
let montado = false;
escucharHub((msg) => {
  if (msg.tipo !== 'codex:load' || montado) return;
  montado = true;
  const bloques: BlockData[] = Array.isArray(msg.bloques) ? msg.bloques : [];
  aplicarTema(msg.tema);
  root.render(
    <React.StrictMode>
      <App initialBlocks={bloques} initialDark={!!msg.tema?.oscuro} />
    </React.StrictMode>
  );
});
enviarAlHub({ tipo: 'codex:ready' });
