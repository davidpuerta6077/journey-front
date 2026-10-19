import type { BlockData } from './types';

// Canal con Bravo Hub (ventana padre del iframe). Solo se aceptan mensajes del
// mismo origen y de la ventana padre; el editor nunca ve el token ni la API.
export type MensajeHub =
  | { tipo: 'codex:load'; bloques: BlockData[] }
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
