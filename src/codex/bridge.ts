import type { BlockData } from './types';

// Canal con Bravo Hub (ventana padre del iframe). Solo se aceptan mensajes del
// mismo origen y de la ventana padre; el editor nunca ve el token ni la API.
// Colores, fuente y tema (claro/oscuro) de Bravo Hub para que el editor se vea igual.
export type TemaHub = { oscuro: boolean; primario: string; menu: string; fondo: string; fuente: string };

export type MensajeHub =
  | { tipo: 'codex:load'; bloques: BlockData[]; tema?: TemaHub }
  | { tipo: 'codex:tema'; tema: TemaHub }
  | { tipo: 'codex:saved'; hora: string }
  | { tipo: 'codex:save-error'; mensaje: string };

export type MensajeEditor =
  | { tipo: 'codex:ready' }
  | { tipo: 'codex:change'; bloques: BlockData[] };

export function enviarAlHub(msg: MensajeEditor) {
  window.parent.postMessage(msg, window.location.origin);
}

export function escucharHub(handler: (msg: MensajeHub) => void): () => void {
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.source !== window.parent) return;
    if (e.data && typeof e.data.tipo === 'string') handler(e.data as MensajeHub);
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

// Variables que lee hub-theme.css; si falta un valor queda el default de ese archivo.
export function aplicarTema(tema: TemaHub | undefined) {
  if (!tema) return;
  const st = document.documentElement.style;
  if (tema.primario) st.setProperty('--hub-primary', tema.primario);
  if (tema.menu) st.setProperty('--hub-menu', tema.menu);
  if (tema.fondo) st.setProperty('--hub-bg', tema.fondo);
  if (tema.fuente) st.setProperty('--hub-font', tema.fuente);
}
