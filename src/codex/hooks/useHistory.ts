import { useState, useCallback } from 'react';

// Límite de estados guardados en el historial de undo (past + future).
const MAX_HISTORY = 30;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// Un solo useState con updaters puros (nada de setState anidado dentro del updater):
// bajo <React.StrictMode> React invoca cada updater dos veces para detectar efectos
// secundarios impuros; la versión anterior llamaba setPast/setFuture DENTRO del updater
// de _setState, duplicando entradas del historial en dev. Al mantener past/present/future
// en un único objeto actualizado atómicamente, cada llamada resulta en una sola transición
// de estado sin efectos secundarios que StrictMode pueda ejecutar dos veces.
export function useHistory<T>(initialState: T | (() => T)) {
  const [history, setHistory] = useState<HistoryState<T>>(() => ({
    past: [],
    present: initialState instanceof Function ? (initialState as () => T)() : initialState,
    future: [],
  }));

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const value = newState instanceof Function ? (newState as (prev: T) => T)(h.present) : newState;
      if (Object.is(h.present, value)) return h;
      const past = [...h.past, h.present];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: value, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const past = [...h.past];
      const previous = past.pop() as T;
      return { past, present: previous, future: [h.present, ...h.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const future = [...h.future];
      const next = future.shift() as T;
      return { past: [...h.past, h.present], present: next, future };
    });
  }, []);

  return [history.present, setState, undo, redo, history.past.length > 0, history.future.length > 0] as const;
}
