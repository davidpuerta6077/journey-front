import React from 'react';
import { BlockData } from '../types';
import { Plus, Columns, ClipboardPaste } from 'lucide-react-codex';
import { useClipboard, cloneFromClipboard } from './ClipboardContext';

interface NestedAreaProps {
  blocks: BlockData[];
  parentId: string;
  areaId: string;
  label?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateSection?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number, id: string, parentId?: string, colId?: string) => void;
  onDragOver: (e: React.DragEvent, index: number, parentId?: string, colId?: string) => void;
  onDrop: (e: React.DragEvent, index: number, parentId?: string, colId?: string) => void;
  dropTarget: { index: number | null; parentId: string | undefined; colId: string | undefined } | null;
  darkMode?: boolean;
  preview?: boolean;
  // BlockRenderer is passed as a render prop to avoid circular imports
  BlockRendererComponent: React.ComponentType<any>;
  // Callback to insert a block at a given position in this area
  onInsertBlock?: (block: BlockData, index: number, parentId: string, areaId: string) => void;
}

export const NestedArea: React.FC<NestedAreaProps> = ({
  blocks,
  parentId,
  areaId,
  label,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onDuplicateSection,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  dropTarget,
  darkMode = false,
  preview = false,
  BlockRendererComponent,
  onInsertBlock,
}) => {
  const { clipboard, hasCopied } = useClipboard();
  const isDropActive = dropTarget?.parentId === parentId && dropTarget?.colId === areaId;
  const bg = darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50/80 border-gray-200';
  const activeBg = 'bg-blue-50 border-blue-400';

  const handlePaste = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clipboard || !onInsertBlock) return;
    const fresh = cloneFromClipboard(clipboard);
    onInsertBlock(fresh, blocks.length, parentId, areaId);
  };

  // PREVIEW MODE: render blocks cleanly without any editor UI
  if (preview) {
    return (
      <div>
        {blocks.map((block, index) => (
          <BlockRendererComponent
            key={block.id}
            block={block}
            index={index}
            parentId={parentId}
            columnId={areaId}
            selectedId={null}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            dropTarget={null}
            darkMode={darkMode}
            preview={true}
            isNested={true}
            isFirstBlock={index === 0}
            isLastBlock={index === blocks.length - 1}
          />
        ))}
        {blocks.length === 0 && <div className="text-gray-300 text-xs italic py-2">Sin contenido</div>}
      </div>
    );
  }

  // EDIT MODE: full drag & drop UI
  return (
    <div
      className={`
        min-h-[80px] rounded-lg border-2 border-dashed transition-all p-2
        ${isDropActive ? activeBg : bg}
      `}
      onDragOver={(e) => onDragOver(e, blocks.length, parentId, areaId)}
      onDrop={(e) => onDrop(e, blocks.length, parentId, areaId)}
    >
      {/* Label row — con botón pegar si hay algo en el portapapeles */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${darkMode ? 'text-gray-400 bg-gray-600' : 'text-gray-400 bg-gray-100'}`}>
            {label}
          </span>
        )}
        {!label && <span />}

        <div className="flex items-center gap-1.5">
          {isDropActive && (
            <span className="text-[10px] text-blue-500 font-bold animate-pulse">Suelta aquí</span>
          )}
          {/* ✅ BOTÓN PEGAR: aparece solo cuando hay algo copiado */}
          {hasCopied && onInsertBlock && (
            <button
              onClick={handlePaste}
              title={`Pegar "${clipboard?.type}" al final del área`}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors"
            >
              <ClipboardPaste size={11} />
              Pegar {clipboard?.type}
            </button>
          )}
        </div>
      </div>

      {/* Blocks */}
      {blocks.map((block, index) => (
        <BlockRendererComponent
          key={block.id}
          block={block}
          index={index}
          parentId={parentId}
          columnId={areaId}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onDuplicateSection={onDuplicateSection}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isFirstBlock={index === 0}
          isLastBlock={index === blocks.length - 1}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          dropTarget={dropTarget}
          darkMode={darkMode}
          preview={false}
          isNested={true}
        />
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-300 pointer-events-none select-none">
          <Columns size={20} className="mb-1 opacity-50" />
          <span className="text-xs font-medium">Arrastra bloques desde el sidebar</span>
        </div>
      )}

      {/* Drop zone at end when has blocks */}
      {blocks.length > 0 && (
        <div
          className={`h-8 w-full flex items-center justify-center mt-2 rounded border-2 border-dashed transition-all text-xs
            ${isDropActive && dropTarget?.index === blocks.length
              ? 'border-blue-400 bg-blue-50 text-blue-500 font-bold'
              : darkMode ? 'border-gray-500 text-gray-400' : 'border-gray-200 text-gray-300'
            }`}
          onDragOver={(e) => onDragOver(e, blocks.length, parentId, areaId)}
          onDrop={(e) => onDrop(e, blocks.length, parentId, areaId)}
        >
          {isDropActive && dropTarget?.index === blocks.length ? '↓ Soltar aquí' : '+ agregar al final'}
        </div>
      )}
    </div>
  );
};