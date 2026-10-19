import React, { createContext, useContext, useState, useCallback } from 'react';
import { BlockData } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ClipboardContextValue {
  clipboard: BlockData | null;
  copyBlock: (block: BlockData) => void;
  clearClipboard: () => void;
  hasCopied: boolean;
}

const ClipboardContext = createContext<ClipboardContextValue>({
  clipboard: null,
  copyBlock: () => {},
  clearClipboard: () => {},
  hasCopied: false,
});

// Deep clone a block with fresh IDs
const cloneBlockDeep = (b: BlockData): BlockData => {
  const cloned: BlockData = {
    ...b,
    id: uuidv4(),
    columns: b.columns?.map(c => ({
      ...c,
      id: uuidv4(),
      blocks: c.blocks.map(cloneBlockDeep),
    })),
  };
  if (b.areas) {
    const newAreas: Record<string, BlockData[]> = {};
    for (const [k, v] of Object.entries(b.areas)) {
      newAreas[k] = v.map(cloneBlockDeep);
    }
    cloned.areas = newAreas;
  }
  return cloned;
};

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboard, setClipboard] = useState<BlockData | null>(null);

  const copyBlock = useCallback((block: BlockData) => {
    // Store a deep clone so subsequent edits don't affect the clipboard
    setClipboard(cloneBlockDeep(block));
  }, []);

  const clearClipboard = useCallback(() => setClipboard(null), []);

  return (
    <ClipboardContext.Provider value={{ clipboard, copyBlock, clearClipboard, hasCopied: clipboard !== null }}>
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = () => useContext(ClipboardContext);

// Returns a fresh clone of the clipboard item (new IDs), ready to insert
export const cloneFromClipboard = (clipboard: BlockData): BlockData => cloneBlockDeep(clipboard);