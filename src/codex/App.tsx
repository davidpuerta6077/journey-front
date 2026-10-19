import './index.css';
import './hub-theme.css';
import iconCodex from '../assets/Recursos/Iconos/Para fondo oscuros/SVG/codex.svg';
import iconCodexClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/codex_1.svg';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BlockData, BlockType, BlockUpdate } from './types';
import { BlockRenderer } from './components/BlockRenderer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { generateMoodleHTML } from './utils/htmlGenerator';
import { useHistory } from './hooks/useHistory';
import { getDefaultContent, getDefaultStyle } from './utils/blockDefaults';
import { TemplatesModal } from './components/TemplatesModal';
import { LayoutModal } from './components/LayoutModal';
import { HtmlModal } from './components/HtmlModal';
import { WidgetButton } from './components/WidgetButton';
import {
  Type, Image as ImageIcon, Layout, AlertCircle, Video, Minus, MousePointer2, Code, X,
  Columns, Trash2, Eye, Copy, CheckCircle, ListPlus, Rotate3D, Award, BookOpenCheck,
  Headphones, TableProperties, Quote, MessageSquare, CheckSquare, LayoutPanelLeft, BoxSelect,
  MessageCircle, Table as TableIcon, Plus, Save, HelpCircle as QuestionIcon,
  Undo, Redo, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Search,
  FolderOpen, Moon, Sun, Clock, BarChart2, Flag,
  Quote as QuoteIcon, FileDown, Download, Upload, ChevronRight, Terminal, ChevronDown, ImagePlus,
  BookOpen, Clipboard, ClipboardPaste, Monitor, Tablet, Smartphone, ArrowDown,
} from 'lucide-react-codex';
import { v4 as uuidv4 } from 'uuid';
import { ClipboardProvider, useClipboard, cloneFromClipboard } from './components/ClipboardContext';
import { enviarAlHub, escucharHub, aplicarTema } from './bridge';

const KeyboardShortcutsHandler: React.FC<{ onPaste: (block: BlockData) => void }> = ({ onPaste }) => {
  const { clipboard } = useClipboard();
  const stateRef = React.useRef({ clipboard, onPaste });
  stateRef.current = { clipboard, onPaste };

  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && stateRef.current.clipboard) {
        e.preventDefault();
        stateRef.current.onPaste(cloneFromClipboard(stateRef.current.clipboard));
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return null;
};

const CanvasPasteButton: React.FC<{ onPasteBlock: (block: BlockData) => void }> = ({ onPasteBlock }) => {
  const { hasCopied, clipboard } = useClipboard();
  if (!hasCopied || !clipboard) return null;
  return (
    <button
      onClick={() => onPasteBlock(cloneFromClipboard(clipboard))}
      title={`Pegar "${clipboard.type.toLowerCase().replace(/_/g, ' ')}"`}
      className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 active:scale-95 transition-all shadow-sm"
    >
      <ClipboardPaste size={14} />
      Pegar "{clipboard.type.toLowerCase().replace(/_/g, ' ')}"
    </button>
  );
};

const ClipboardIndicator: React.FC = () => {
  const { hasCopied, clipboard, clearClipboard } = useClipboard();
  if (!hasCopied) return null;
  return (
    <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 rounded-lg px-2.5 py-1.5 text-purple-200 text-xs font-medium">
      <Clipboard size={12}/>
      <span>Copiado: {clipboard?.type?.toLowerCase().replace(/_/g, ' ')}</span>
      <button onClick={clearClipboard} title="Limpiar portapapeles" className="ml-1 text-purple-300 hover:text-white transition-colors"><X size={10}/></button>
    </div>
  );
};

const QUICK_ADD_TYPES = [
  { type: BlockType.HEADING, label: 'Título' },
  { type: BlockType.TEXT, label: 'Texto' },
  { type: BlockType.IMAGE, label: 'Imagen' },
  { type: BlockType.DIVIDER, label: 'Divisor' },
  { type: BlockType.BUTTON, label: 'Botón' },
  { type: BlockType.ALERT, label: 'Alerta' },
] as const;

const InlineAddButton: React.FC<{ index: number; onAdd: (type: BlockType) => void; darkMode: boolean }> = ({ onAdd, darkMode }) => {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-center h-5 group/add"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); }}>
      {(hovered || open) && (
        <div className="absolute inset-x-0 flex items-center gap-2 justify-center z-10">
          <div className={`flex-1 h-px ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}/>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
            className={`flex items-center justify-center w-5 h-5 rounded-full text-white shadow-md transition-all
              ${open ? 'bg-[#009AB2] rotate-45' : 'bg-[#009AB2] hover:bg-[#007a8e]'}`}
          >
            <Plus size={12}/>
          </button>
          <div className={`flex-1 h-px ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}/>
        </div>
      )}
      {open && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl border
          ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
          onClick={e => e.stopPropagation()}>
          {QUICK_ADD_TYPES.map(({ type, label }) => (
            <button key={type} onClick={() => { onAdd(type); setOpen(false); }}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors
                ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Clona un bloque y todo su subárbol (columnas/áreas) con IDs nuevos. Usado por
// duplicateBlock, duplicateSection y loadBuiltInTemplate — antes cada uno tenía su
// propia copia idéntica de esta función.
const cloneBlockDeep = (b: BlockData): BlockData => {
  const cloned: BlockData = { ...b, id: uuidv4(), columns: b.columns?.map(c => ({ ...c, id: uuidv4(), blocks: c.blocks.map(cloneBlockDeep) })) };
  if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = v.map(cloneBlockDeep); cloned.areas = na; }
  return cloned;
};

const App: React.FC<{ initialBlocks: BlockData[]; initialDark: boolean }> = ({ initialBlocks, initialDark }) => {
  const [blocks, setBlocks, undo, redo, canUndo, canRedo] = useHistory<BlockData[]>(() => initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  // Claro/oscuro lo decide Bravo Hub (codex:load / codex:tema).
  const [darkMode, setDarkMode] = useState<boolean>(initialDark);
  useEffect(() => { document.documentElement.dataset.oscuro = String(darkMode); }, [darkMode]);
  const [leftOpen, setLeftOpen] = useState<boolean>(() => { try { return localStorage.getItem('afrodita_v5_left') !== 'false'; } catch { return true; } });
  const [rightOpen, setRightOpen] = useState<boolean>(() => { try { return localStorage.getItem('afrodita_v5_right') !== 'false'; } catch { return true; } });
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => { try { return parseInt(localStorage.getItem('afrodita_v5_right_width') || '380', 10); } catch { return 380; } });
  const rightResizingRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [savedAt, setSavedAt] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  const [deleteToast, setDeleteToast] = useState(false);
  const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current); }, []);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => { try { localStorage.setItem('afrodita_v5_left', String(leftOpen)); } catch {} }, [leftOpen]);
  useEffect(() => { try { localStorage.setItem('afrodita_v5_right', String(rightOpen)); } catch {} }, [rightOpen]);
  useEffect(() => { try { localStorage.setItem('afrodita_v5_right_width', String(rightPanelWidth)); } catch {} }, [rightPanelWidth]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  // Lectura síncrona para Bravo Hub (mismo origen) al salir: cubre los cambios
  // de los últimos 500 ms que el debounce aún no envió.
  (window as any).codexBloquesActuales = () => blocksRef.current;

  // Los bloques ya no van a localStorage: se envían a Bravo Hub, que los guarda
  // en la BD y responde con codex:saved / codex:save-error.
  const persistCanvas = useCallback(() => {
    const data = JSON.stringify(blocksRef.current);
    if (data.length > 4_000_000) {
      setSaveError('');
      setSavedAt('Canvas muy grande para guardar');
      return;
    }
    enviarAlHub({ tipo: 'codex:change', bloques: blocksRef.current });
  }, []);

  useEffect(() => escucharHub((msg) => {
    if (msg.tipo === 'codex:saved') { setSaveError(''); setSavedAt(msg.hora); }
    else if (msg.tipo === 'codex:save-error') setSaveError(msg.mensaje);
    else if (msg.tipo === 'codex:tema') { aplicarTema(msg.tema); setDarkMode(!!msg.tema?.oscuro); }
  }), []);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistCanvas, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [blocks, persistCanvas]);

  // El guardado tiene debounce de 500ms: cerrar la pestaña justo tras editar podía perder
  // el último cambio porque el timer nunca llegaba a dispararse. Al cerrar, se guarda ya.
  useEffect(() => {
    const flush = () => { if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); persistCanvas(); } };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [persistCanvas]);

  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [pendingLayoutIndex, setPendingLayoutIndex] = useState<number | null>(null);
  const [pendingLayoutParentId, setPendingLayoutParentId] = useState<string | undefined>(undefined);
  const [pendingLayoutColId, setPendingLayoutColId] = useState<string | undefined>(undefined);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<BlockType | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number | null; parentId: string | undefined; colId: string | undefined } | null>(null);

  const kbRef = useRef<{
    undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
    showLayoutModal: boolean; selectedBlockId: string | null; previewMode: boolean;
    deleteBlock?: (id: string) => void;
    duplicateBlock?: (id: string) => void;
    moveBlock?: (id: string, dir: 'up' | 'down') => void;
  }>({ undo, redo, canUndo, canRedo, showLayoutModal, selectedBlockId, previewMode });
  kbRef.current.undo = undo; kbRef.current.redo = redo;
  kbRef.current.canUndo = canUndo; kbRef.current.canRedo = canRedo;
  kbRef.current.showLayoutModal = showLayoutModal;
  kbRef.current.selectedBlockId = selectedBlockId;
  kbRef.current.previewMode = previewMode;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const s = kbRef.current;

      if (e.key === 'Escape') {
        setShowHtmlModal(false);
        setShowTemplatesModal(false);
        if (s.showLayoutModal) { setShowLayoutModal(false); setPendingLayoutIndex(null); setPendingLayoutParentId(undefined); setPendingLayoutColId(undefined); }
        // Antes solo cerraba modales: Vista Previa no tiene modal, es un modo de pantalla
        // completa, pero el usuario espera igual que Esc lo saque de ahí (como en el resto de la app).
        if (s.previewMode) setPreviewMode(false);
        return;
      }
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) { if (s.canRedo) s.redo(); } else { if (s.canUndo) s.undo(); } return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); if (s.canRedo) s.redo(); return; }

      if (!s.selectedBlockId) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        s.deleteBlock?.(s.selectedBlockId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        s.duplicateBlock?.(s.selectedBlockId);
        return;
      }
      if (e.key === 'ArrowUp' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        s.moveBlock?.(s.selectedBlockId, 'up');
        return;
      }
      if (e.key === 'ArrowDown' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        s.moveBlock?.(s.selectedBlockId, 'down');
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const findBlock = (id: string, list: BlockData[]): BlockData | null => {
    for (const block of list) {
      if (block.id === id) return block;
      if (block.columns) { for (const col of block.columns) { const f = findBlock(id, col.blocks); if (f) return f; } }
      if (block.areas) { for (const ab of Object.values(block.areas)) { const f = findBlock(id, ab); if (f) return f; } }
    }
    return null;
  };

  const findBlockLocation = (id: string, list: BlockData[], parentId?: string, colId?: string): { index: number; parentId?: string; colId?: string } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { index: i, parentId, colId };
      const b = list[i];
      if (b.columns) { for (const col of b.columns) { const f = findBlockLocation(id, col.blocks, b.id, col.id); if (f) return f; } }
      if (b.areas) { for (const [k, v] of Object.entries(b.areas)) { const f = findBlockLocation(id, v, b.id, k); if (f) return f; } }
    }
    return null;
  };

  // IDs propios + de todo el subárbol (columnas/áreas anidadas). Se usa para impedir
  // soltar un bloque dentro de sí mismo o de un descendiente suyo (perdería el subárbol).
  const collectIds = (b: BlockData): Set<string> => {
    const ids = new Set<string>([b.id]);
    b.columns?.forEach(c => c.blocks.forEach(cb => collectIds(cb).forEach(id => ids.add(id))));
    if (b.areas) Object.values(b.areas).forEach(list => list.forEach(ab => collectIds(ab).forEach(id => ids.add(id))));
    return ids;
  };

  // Detecta bloques "contenedor" (Alerta, Acordeón, Tabs, etc.) sin contenido real: se
  // exportan como cajas vacías en Moodle sin que el usuario lo note hasta revisar el HTML.
  const CONTAINER_TYPES_WITH_EMPTY_CHECK = new Set([
    BlockType.ALERT, BlockType.ACCORDION, BlockType.TABS, BlockType.CONCLUSION,
    BlockType.TASK, BlockType.CITATION, BlockType.FORUM, BlockType.QUESTIONNAIRE, BlockType.INTRO_CARD,
  ]);
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const isBlockTextEmpty = (b: BlockData): boolean => {
    if (b.areas) return Object.values(b.areas).every(list => list.length === 0 || list.every(isBlockTextEmpty));
    if (b.columns) return b.columns.every(c => c.blocks.every(isBlockTextEmpty));
    const text = (b.content as Record<string, unknown>)?.text;
    if (typeof text === 'string') return stripHtml(text) === '';
    return false;
  };
  const countEmptyContainers = (list: BlockData[]): number => {
    let n = 0;
    list.forEach(b => {
      if (CONTAINER_TYPES_WITH_EMPTY_CHECK.has(b.type) && isBlockTextEmpty(b)) n++;
      if (b.columns) b.columns.forEach(c => { n += countEmptyContainers(c.blocks); });
      if (b.areas) Object.values(b.areas).forEach(v => { n += countEmptyContainers(v); });
    });
    return n;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedBlock = useMemo(() => selectedBlockId ? findBlock(selectedBlockId, blocks) : null, [selectedBlockId, blocks]);

  const addBlock = (type: BlockType, index: number, parentId?: string, colId?: string) => {
    if (type === BlockType.LAYOUT) {
      setPendingLayoutIndex(index); setPendingLayoutParentId(parentId); setPendingLayoutColId(colId);
      setShowLayoutModal(true); return;
    }
    const newBlock = { id: uuidv4(), type, content: getDefaultContent(type), style: getDefaultStyle(type) } as BlockData;
    if (type === BlockType.SABER_COLUMNS) {
      newBlock.columns = [
        { id: uuidv4(), width: '50%', blocks: [
          { id: uuidv4(), type: BlockType.HEADING, content: { text: 'Para Saber', level: 'h3', colorClass: 'text-primary' }, style: { textAlign: 'center', padding: '10px' } },
          { id: uuidv4(), type: BlockType.TEXT, content: { text: '<p>Aquí va el contenido teórico o conceptual...</p>' }, style: {} }
        ]},
        { id: uuidv4(), width: '50%', blocks: [
          { id: uuidv4(), type: BlockType.HEADING, content: { text: 'Para Hacer', level: 'h3', colorClass: 'text-orange' }, style: { textAlign: 'center', padding: '10px' } },
          { id: uuidv4(), type: BlockType.TEXT, content: { text: '<p>Aquí va la actividad práctica o ejercicio...</p>' }, style: {} }
        ]},
      ];
    }
    const mkText = (text: string): BlockData => ({ id: uuidv4(), type: BlockType.TEXT, content: { text }, style: { textAlign: 'left', padding: '0px' } });
    if (type === BlockType.CONCLUSION) newBlock.areas = { content: [mkText('')] };
    else if (type === BlockType.ALERT) newBlock.areas = { content: [mkText('')] };
    else if (type === BlockType.FORUM) newBlock.areas = { content: [mkText('')] };
    else if (type === BlockType.QUESTIONNAIRE) newBlock.areas = { content: [mkText('')] };
    else if (type === BlockType.CITATION) newBlock.areas = { content: [mkText('')] };
    else if (type === BlockType.TASK) {
      newBlock.areas = {
        itinerary: [mkText('')],
        evaluation: [mkText('')]
      };
    } else if (type === BlockType.ACCORDION) {
      newBlock.areas = { 'item-0': [mkText('')], 'item-1': [mkText('')] };
    } else if (type === BlockType.TABS) {
      newBlock.areas = { 'item-0': [mkText('')], 'item-1': [mkText('')] };
    } else if (type === BlockType.INTRO_CARD) {
      newBlock.areas = { content: [mkText('')] };
    } else if (type === BlockType.MODAL) {
      newBlock.areas = { modal: [mkText('')] };
    }
    insertBlockAt(newBlock, index, parentId, colId);
  };

  const addLayoutBlock = (structure: number[]) => {
    if (pendingLayoutIndex === null) return;
    const newBlock: BlockData = { id: uuidv4(), type: BlockType.LAYOUT, content: {}, style: { padding: '0px' }, columns: structure.map(width => ({ id: uuidv4(), width: `${width}%`, blocks: [] })) };
    insertBlockAt(newBlock, pendingLayoutIndex, pendingLayoutParentId, pendingLayoutColId);
    setShowLayoutModal(false); setPendingLayoutIndex(null); setPendingLayoutParentId(undefined); setPendingLayoutColId(undefined);
  };

  const insertBlockAt = (block: BlockData, index: number, parentId?: string, colId?: string) => {
    if (!parentId) {
      setBlocks(prev => { const nb = [...prev]; nb.splice(index, 0, block); return nb; });
    } else {
      const updateRecursive = (list: BlockData[]): BlockData[] => list.map(b => {
        if (b.id === parentId) {
          if (b.columns) { const col = b.columns.find(c => c.id === colId); if (col) return { ...b, columns: b.columns.map(c => { if (c.id === colId) { const nb = [...c.blocks]; nb.splice(index, 0, block); return { ...c, blocks: nb }; } return c; }) }; }
          if (colId && !b.columns) { const nb = [...(b.areas?.[colId] || [])]; nb.splice(index, 0, block); return { ...b, areas: { ...(b.areas || {}), [colId]: nb } }; }
        }
        if (b.columns) return { ...b, columns: b.columns.map(c => ({ ...c, blocks: updateRecursive(c.blocks) })) };
        if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = updateRecursive(v); return { ...b, areas: na }; }
        return b;
      });
      setBlocks(prev => updateRecursive(prev));
    }
    setSelectedBlockId(block.id);
  };

  const updateBlock = (id: string, updates: BlockUpdate) => {
    const updateRecursive = (list: BlockData[]): BlockData[] => list.map(b => {
      if (b.id === id) return { ...b, ...updates } as BlockData;
      if (b.columns) return { ...b, columns: b.columns.map(col => ({ ...col, blocks: updateRecursive(col.blocks) })) } as BlockData;
      if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = updateRecursive(v); return { ...b, areas: na } as BlockData; }
      return b;
    });
    setBlocks(prev => updateRecursive(prev));
  };

  const deleteBlock = (id: string) => {
    const deleteRecursive = (list: BlockData[]): BlockData[] => list.filter(b => b.id !== id).map(b => {
      if (b.columns) return { ...b, columns: b.columns.map(col => ({ ...col, blocks: deleteRecursive(col.blocks) })) };
      if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = deleteRecursive(v); return { ...b, areas: na }; }
      return b;
    });
    setBlocks(prev => deleteRecursive(prev));
    if (selectedBlockId === id) setSelectedBlockId(null);
    // No hay confirm() para no frenar el flujo (a diferencia de "Limpiar", que borra TODO
    // el diseño y sí lo amerita) — en su lugar, un toast breve recuerda que se puede deshacer,
    // ya que un profesor no técnico puede no conocer Ctrl+Z.
    if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
    setDeleteToast(true);
    deleteToastTimerRef.current = setTimeout(() => setDeleteToast(false), 4000);
  };

  const duplicateBlock = (id: string) => {
    const block = findBlock(id, blocks); if (!block) return;
    const newBlock = cloneBlockDeep(block);
    const loc = findBlockLocation(id, blocks);
    if (loc) insertBlockAt(newBlock, loc.index + 1, loc.parentId, loc.colId);
    else insertBlockAt(newBlock, blocks.length);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const loc = findBlockLocation(id, blocks);
    if (!loc) return;
    const { index, parentId, colId } = loc;

    const swapInList = (list: BlockData[]): BlockData[] => {
      const si = direction === 'up' ? index - 1 : index + 1;
      if (si < 0 || si >= list.length) return list;
      const nb = [...list];
      [nb[index], nb[si]] = [nb[si], nb[index]];
      return nb;
    };

    if (!parentId) {
      setBlocks(prev => swapInList(prev));
      return;
    }

    const updateRecursive = (list: BlockData[]): BlockData[] => list.map(b => {
      if (b.id === parentId) {
        if (b.columns) return { ...b, columns: b.columns.map(c => c.id === colId ? { ...c, blocks: swapInList(c.blocks) } : c) };
        if (colId && b.areas) return { ...b, areas: { ...b.areas, [colId]: swapInList(b.areas[colId] || []) } };
      }
      if (b.columns) return { ...b, columns: b.columns.map(c => ({ ...c, blocks: updateRecursive(c.blocks) })) };
      if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = updateRecursive(v); return { ...b, areas: na }; }
      return b;
    });
    setBlocks(prev => updateRecursive(prev));
  };

  kbRef.current.deleteBlock = deleteBlock;
  kbRef.current.duplicateBlock = duplicateBlock;
  kbRef.current.moveBlock = moveBlock;

  const duplicateSection = (id: string) => {
    const block = findBlock(id, blocks); if (!block) return;
    const newBlock = cloneBlockDeep(block);
    const loc = findBlockLocation(id, blocks);
    insertBlockAt(newBlock, loc ? loc.index + 1 : blocks.length, loc?.parentId, loc?.colId);
  };

  const handleDragStartFromSidebar = (e: React.DragEvent, type: BlockType) => { e.dataTransfer.setData('source', 'sidebar'); e.dataTransfer.setData('type', type); setDraggedType(type); };
  const toggleCategory = useCallback((key: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);
  const handleDragStartFromCanvas = (e: React.DragEvent, index: number, id: string, parentId?: string, colId?: string) => { e.stopPropagation(); e.dataTransfer.setData('source', 'canvas'); e.dataTransfer.setData('index', index.toString()); e.dataTransfer.setData('id', id); if (parentId) e.dataTransfer.setData('parentId', parentId); if (colId) e.dataTransfer.setData('colId', colId); setDraggedBlockId(id); };
  const handleDragOver = (e: React.DragEvent, index: number, parentId?: string, colId?: string) => {
    e.preventDefault(); e.stopPropagation();
    if (draggedBlockId) {
      if (draggedBlockId === parentId) return;
      // Impide mostrar el indicador de "soltar aquí" dentro de un descendiente propio.
      const dragged = findBlock(draggedBlockId, blocks);
      if (dragged && parentId && collectIds(dragged).has(parentId)) return;
    }
    setDropTarget({ index, parentId, colId });
  };

  const handleDrop = (e: React.DragEvent, index: number, parentId?: string, colId?: string) => {
    e.preventDefault(); e.stopPropagation();
    const source = e.dataTransfer.getData('source');
    if (source === 'sidebar') { const type = e.dataTransfer.getData('type') as BlockType; if (type) addBlock(type, index, parentId, colId); }
    else if (source === 'canvas') {
      const sourceId = e.dataTransfer.getData('id');
      if (sourceId === dropTarget?.parentId) { setDraggedBlockId(null); setDraggedType(null); setDropTarget(null); return; }
      const sourceIndexStr = e.dataTransfer.getData('index');
      const sourceIndex = sourceIndexStr !== '' ? parseInt(sourceIndexStr, 10) : null;
      const sourceParentId = e.dataTransfer.getData('parentId') || undefined;
      const sourceColId = e.dataTransfer.getData('colId') || undefined;

      const removeAndFind = (list: BlockData[]): { newList: BlockData[], found: BlockData | null } => {
        let foundBlock: BlockData | null = null;
        const newList = list.reduce<BlockData[]>((acc, b) => {
          if (b.id === sourceId) { foundBlock = b; return acc; }
          let updated = { ...b };
          if (b.columns) { const nc = b.columns.map(col => { const res = removeAndFind(col.blocks); if (res.found) foundBlock = res.found; return { ...col, blocks: res.newList }; }); updated = { ...updated, columns: nc }; }
          if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) { const res = removeAndFind(v); if (res.found) foundBlock = res.found; na[k] = res.newList; } updated = { ...updated, areas: na }; }
          acc.push(updated); return acc;
        }, []);
        return { newList, found: foundBlock };
      };
      const { newList, found } = removeAndFind(blocks);
      // Evita soltar un contenedor dentro de sí mismo o de un descendiente suyo: found
      // conserva todo su subárbol, así que si el destino cae dentro de esos IDs, se aborta
      // (de lo contrario insertIntoList nunca encontraría el destino y el bloque desaparecería).
      const droppingIntoOwnSubtree = !!found && !!parentId && collectIds(found).has(parentId);
      if (found && !droppingIntoOwnSubtree) {
        // removeAndFind ya quitó el bloque origen de la lista: si origen y destino son la
        // misma lista y el origen estaba antes del índice destino, ese índice quedó
        // desfasado un puesto hacia atrás.
        const sameList = sourceParentId === parentId && sourceColId === colId;
        const targetIndex = (sameList && sourceIndex !== null && sourceIndex < index) ? index - 1 : index;

        const insertIntoList = (list: BlockData[], tPId?: string, tCId?: string, tIdx?: number): BlockData[] => {
          if (!tPId) { const l = [...list]; l.splice(tIdx !== undefined ? tIdx : l.length, 0, found!); return l; }
          return list.map(b => {
            if (b.id === tPId) {
              if (b.columns) { const col = b.columns.find(c => c.id === tCId); if (col) return { ...b, columns: b.columns.map(c => { if (c.id === tCId) { const l = [...c.blocks]; l.splice(tIdx !== undefined ? tIdx : l.length, 0, found!); return { ...c, blocks: l }; } return c; }) }; }
              if (tCId && b.areas && tCId in b.areas) { const l = [...(b.areas[tCId] || [])]; l.splice(tIdx !== undefined ? tIdx : l.length, 0, found!); return { ...b, areas: { ...b.areas, [tCId]: l } }; }
            }
            if (b.columns) return { ...b, columns: b.columns.map(c => ({ ...c, blocks: insertIntoList(c.blocks, tPId, tCId, tIdx) })) };
            if (b.areas) { const na: Record<string, BlockData[]> = {}; for (const [k, v] of Object.entries(b.areas)) na[k] = insertIntoList(v, tPId, tCId, tIdx); return { ...b, areas: na }; }
            return b;
          });
        };
        setBlocks(insertIntoList(newList, parentId, colId, targetIndex));
      }
    }
    setDraggedBlockId(null); setDraggedType(null); setDropTarget(null);
  };

  const confirmExportIfEmpty = () => {
    const emptyCount = countEmptyContainers(blocks);
    if (emptyCount === 0) return true;
    return window.confirm(`Hay ${emptyCount} bloque${emptyCount > 1 ? 's' : ''} sin contenido (se verán vacíos en Moodle). ¿Generar de todas formas?`);
  };
  const handleExportHtml = () => { if (!confirmExportIfEmpty()) return; setGeneratedHtml(generateMoodleHTML(blocks)); setShowHtmlModal(true); };
  const handleSaveHtmlFile = () => { if (!confirmExportIfEmpty()) return; const blob = new Blob([generateMoodleHTML(blocks)], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'contenido_moodle.html'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };
  const handleClearCanvas = () => { if (window.confirm('¿Estás seguro de que quieres borrar todo el diseño?')) { setBlocks([]); setSelectedBlockId(null); } };
  const handleExportTemplate = () => { const blob = new Blob([JSON.stringify(blocks, null, 2)], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'plantilla_moodle_builder.json'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };
  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    const validBlockTypes = new Set(Object.values(BlockType));
    // Valida el árbol completo (antes solo validaba el nivel superior): un bloque anidado
    // malformado en columns/areas pasaba sin control y podía romper el render o el export.
    const isValidBlock = (b: any): boolean => {
      if (!b?.id || !validBlockTypes.has(b?.type) || b?.content === undefined || b?.style === undefined) return false;
      if (b.columns !== undefined) {
        if (!Array.isArray(b.columns)) return false;
        if (!b.columns.every((c: any) => c?.id && Array.isArray(c.blocks) && c.blocks.every(isValidBlock))) return false;
      }
      if (b.areas !== undefined) {
        if (typeof b.areas !== 'object' || b.areas === null) return false;
        if (!Object.values(b.areas).every((v: any) => Array.isArray(v) && v.every(isValidBlock))) return false;
      }
      return true;
    };
    reader.onload = (ev) => { try { const parsed = JSON.parse(ev.target?.result as string); if (Array.isArray(parsed) && parsed.every(isValidBlock)) { if (blocks.length > 0) { if (!window.confirm('¿Reemplazar el diseño actual con la plantilla?')) return; } setBlocks(parsed); setSelectedBlockId(null); } else { alert('El archivo no tiene el formato de plantilla válido.'); } } catch { alert('El archivo no es una plantilla válida (JSON inválido).'); } };
    reader.readAsText(file); e.target.value = '';
  };
  const loadBuiltInTemplate = (templateBlocks: BlockData[]) => {
    const fresh = templateBlocks.map(cloneBlockDeep);
    if (blocks.length > 0) { if (!window.confirm('¿Reemplazar el diseño actual con esta plantilla?')) return; }
    setBlocks(fresh); setSelectedBlockId(null); setShowTemplatesModal(false);
  };

  // ── WIDGETS ──
  // Category accent colors — pass 4.5:1 on #1E1B4B
  const CAT_COLORS: Record<string, string> = {
    'Estructura':      '#60A5FA',
    'Contenido Básico':'#34D399',
    'Interactivos':    '#A78BFA',
    'Plantillas PB':   '#FBBF24',
    'Avanzados':       '#F87171',
  };

  const allWidgets = useMemo(() => [
    { icon: <Columns size={22}/>, label: 'Columnas', type: BlockType.LAYOUT, category: 'Estructura', onClick: () => { setPendingLayoutIndex(blocks.length); setShowLayoutModal(true); } },
    { icon: <Minus size={22}/>, label: 'Separador', type: BlockType.DIVIDER, category: 'Estructura', onClick: () => addBlock(BlockType.DIVIDER, blocks.length) },
    { icon: <LayoutPanelLeft size={22}/>, label: 'Cols. Saber', type: BlockType.SABER_COLUMNS, category: 'Estructura', onClick: () => addBlock(BlockType.SABER_COLUMNS, blocks.length) },
    { icon: <Type size={22}/>, label: 'Título', type: BlockType.HEADING, category: 'Contenido Básico', onClick: () => addBlock(BlockType.HEADING, blocks.length) },
    { icon: <Layout size={22}/>, label: 'Texto', type: BlockType.TEXT, category: 'Contenido Básico', onClick: () => addBlock(BlockType.TEXT, blocks.length) },
    { icon: <ImageIcon size={22}/>, label: 'Imagen', type: BlockType.IMAGE, category: 'Contenido Básico', onClick: () => addBlock(BlockType.IMAGE, blocks.length) },
    { icon: <Video size={22}/>, label: 'Video', type: BlockType.VIDEO, category: 'Contenido Básico', onClick: () => addBlock(BlockType.VIDEO, blocks.length) },
    { icon: <TableIcon size={22}/>, label: 'Tabla', type: BlockType.TABLE, category: 'Contenido Básico', onClick: () => addBlock(BlockType.TABLE, blocks.length) },
    { icon: <MousePointer2 size={22}/>, label: 'Botón', type: BlockType.BUTTON, category: 'Interactivos', onClick: () => addBlock(BlockType.BUTTON, blocks.length) },
    { icon: <AlertCircle size={22}/>, label: 'Caja/Alert', type: BlockType.ALERT, category: 'Interactivos', onClick: () => addBlock(BlockType.ALERT, blocks.length) },
    { icon: <ListPlus size={22}/>, label: 'Acordeón', type: BlockType.ACCORDION, category: 'Interactivos', onClick: () => addBlock(BlockType.ACCORDION, blocks.length) },
    { icon: <BoxSelect size={22}/>, label: 'Modal Popup', type: BlockType.MODAL, category: 'Interactivos', onClick: () => addBlock(BlockType.MODAL, blocks.length) },
    { icon: <MessageCircle size={22}/>, label: 'Pista (Popover)', type: BlockType.POPOVER, category: 'Interactivos', onClick: () => addBlock(BlockType.POPOVER, blocks.length) },
    { icon: <Rotate3D size={22}/>, label: 'Flip Card', type: BlockType.FLIPCARD, category: 'Interactivos', onClick: () => addBlock(BlockType.FLIPCARD, blocks.length) },
    { icon: <Award size={22}/>, label: 'Tarjeta Icono', type: BlockType.ICON_CARD, category: 'Interactivos', onClick: () => addBlock(BlockType.ICON_CARD, blocks.length) },
    { icon: <QuestionIcon size={22}/>, label: 'Pregunta', type: BlockType.QUIZ, category: 'Interactivos', onClick: () => addBlock(BlockType.QUIZ, blocks.length) },
    { icon: <ChevronDown size={22}/>, label: 'Colapso Icono', type: BlockType.COLLAPSE_ICON, category: 'Interactivos', onClick: () => addBlock(BlockType.COLLAPSE_ICON, blocks.length) },
    { icon: <BookOpenCheck size={22}/>, label: 'Contenedor', type: BlockType.CONCLUSION, category: 'Plantillas PB', onClick: () => addBlock(BlockType.CONCLUSION, blocks.length) },
    { icon: <Headphones size={22}/>, label: 'Pódcast', type: BlockType.PODCAST, category: 'Plantillas PB', onClick: () => addBlock(BlockType.PODCAST, blocks.length) },
    { icon: <TableProperties size={22}/>, label: 'Tabs (V/H)', type: BlockType.TABS, category: 'Plantillas PB', onClick: () => addBlock(BlockType.TABS, blocks.length) },
    { icon: <Quote size={22}/>, label: 'Imagen + Texto', type: BlockType.CITATION, category: 'Plantillas PB', onClick: () => addBlock(BlockType.CITATION, blocks.length) },
    { icon: <CheckCircle size={22}/>, label: 'Tarea', type: BlockType.TASK, category: 'Plantillas PB', onClick: () => addBlock(BlockType.TASK, blocks.length) },
    { icon: <MessageSquare size={22}/>, label: 'Foro', type: BlockType.FORUM, category: 'Plantillas PB', onClick: () => addBlock(BlockType.FORUM, blocks.length) },
    { icon: <CheckSquare size={22}/>, label: 'Cuestionario', type: BlockType.QUESTIONNAIRE, category: 'Plantillas PB', onClick: () => addBlock(BlockType.QUESTIONNAIRE, blocks.length) },
    { icon: <Clock size={22}/>, label: 'Timeline', type: BlockType.TIMELINE, category: 'Avanzados', onClick: () => addBlock(BlockType.TIMELINE, blocks.length) },
    { icon: <BarChart2 size={22}/>, label: 'Estadísticas', type: BlockType.STAT_CARD, category: 'Avanzados', onClick: () => addBlock(BlockType.STAT_CARD, blocks.length) },
    { icon: <BookOpen size={22}/>, label: 'Intro Saber', type: BlockType.INTRO_CARD, category: 'Avanzados', onClick: () => addBlock(BlockType.INTRO_CARD, blocks.length) },
    { icon: <Flag size={22}/>, label: 'Banner Sección', type: BlockType.SECTION_BANNER, category: 'Avanzados', onClick: () => addBlock(BlockType.SECTION_BANNER, blocks.length) },
    { icon: <QuoteIcon size={22}/>, label: 'Cita Textual', type: BlockType.BLOCKQUOTE, category: 'Avanzados', onClick: () => addBlock(BlockType.BLOCKQUOTE, blocks.length) },
    { icon: <FileDown size={22}/>, label: 'Descarga', type: BlockType.DOWNLOAD_CARD, category: 'Avanzados', onClick: () => addBlock(BlockType.DOWNLOAD_CARD, blocks.length) },
    { icon: <Terminal size={22}/>, label: 'Código', type: BlockType.CODE_BLOCK, category: 'Avanzados', onClick: () => addBlock(BlockType.CODE_BLOCK, blocks.length) },
    { icon: <ImagePlus size={22}/>, label: 'Card Imagen', type: BlockType.CARD_IMAGE, category: 'Avanzados', onClick: () => addBlock(BlockType.CARD_IMAGE, blocks.length) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [blocks.length]);

  const filteredWidgets = searchQuery.trim() ? allWidgets.filter(w => w.label.toLowerCase().includes(searchQuery.toLowerCase())) : allWidgets;
  const categories = [
    { key: 'Estructura', icon: <Columns size={12}/> },
    { key: 'Contenido Básico', icon: <Type size={12}/> },
    { key: 'Interactivos', icon: <MousePointer2 size={12}/> },
    { key: 'Plantillas PB', icon: <BookOpenCheck size={12}/> },
    { key: 'Avanzados', icon: <Clock size={12}/> },
  ];

  const handlePasteBlock = (block: BlockData) => {
    if (selectedBlockId) {
      const loc = findBlockLocation(selectedBlockId, blocks);
      if (loc) { insertBlockAt(block, loc.index + 1, loc.parentId, loc.colId); return; }
    }
    insertBlockAt(block, blocks.length);
  };

  return (
    <ClipboardProvider>
    <KeyboardShortcutsHandler onPaste={handlePasteBlock} />
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${darkMode ? "bg-gray-900" : "bg-slate-100"}`}>
      {/* Navbar — bicolor split */}
      <div className="flex h-[52px] flex-shrink-0 z-50">
        {/* Dark half — aligns with sidebar */}
        <div className="flex items-center gap-2.5 px-3.5 flex-shrink-0" style={{ width: 240, background: 'var(--color-sidebar)' }}>
          <div className="flex-shrink-0">
            <img src={iconCodex} alt="" width="34" height="34"/>
          </div>
          <div>
            <div className="font-black text-[12px] leading-none" style={{ color: '#ffffff', letterSpacing: '-0.3px' }}>C0deX</div>
            <div className="font-semibold text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Editor de páginas</div>
          </div>
        </div>

        {/* Light half — over canvas + panel */}
        <div className="codex-toolbar flex flex-1 items-center gap-1.5 px-3.5" style={{ background: 'var(--color-surface-light)', borderBottom: '1px solid color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
          {/* Undo */}
          <button onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)" aria-label="Deshacer"
            className={`nb-btn nb-btn-icon ${canUndo ? 'nb-btn-accent' : 'nb-btn-muted'}`}
            style={!canUndo ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <Undo size={14}/>
          </button>
          {/* Redo */}
          <button onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)" aria-label="Rehacer"
            className={`nb-btn nb-btn-icon ${canRedo ? 'nb-btn-accent' : 'nb-btn-muted'}`}
            style={!canRedo ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <Redo size={14}/>
          </button>

          {/* Divider */}
          <div className="w-px mx-1" style={{ height: 20, background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }}/>

          {/* Limpiar — most prominent secondary action */}
          <button onClick={handleClearCanvas} title="Limpiar canvas" aria-label="Limpiar canvas"
            className="nb-btn nb-btn-danger">
            <Trash2 size={13}/>
            Limpiar
          </button>

          {/* Divider */}
          <div className="w-px mx-1" style={{ height: 20, background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }}/>

          {/* Plantillas */}
          <button onClick={() => setShowTemplatesModal(true)} title="Plantillas prediseñadas" aria-label="Abrir plantillas"
            className="nb-btn nb-btn-muted">
            <LayoutPanelLeft size={13}/>
            Plantillas
          </button>

          {/* Import / Export JSON */}
          <label title="Importar JSON" aria-label="Importar plantilla JSON" className="nb-btn nb-btn-icon nb-btn-muted cursor-pointer">
            <Upload size={13}/>
            <input type="file" accept=".json" className="hidden" onChange={handleImportTemplate}/>
          </label>
          <button onClick={handleExportTemplate} title="Exportar JSON" aria-label="Exportar JSON"
            disabled={blocks.length === 0}
            className="nb-btn nb-btn-icon nb-btn-muted"
            style={blocks.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <Download size={13}/>
          </button>

          {/* Spacer */}
          <div className="flex-1"/>

          {/* Error de guardado — prioridad sobre el timestamp, para que no parezca que sí se guardó */}
          {saveError ? (
            <span title={saveError} role="alert" className="flex items-center gap-1 text-[10px] font-semibold select-none" style={{ color: '#dc2626' }}>
              <AlertCircle size={11}/>
              {saveError}
            </span>
          ) : savedAt && (
            <span title={`Guardado a las ${savedAt}`} className="flex items-center gap-1 text-[10px] select-none" style={{ color: 'var(--color-text-muted)' }}>
              <CheckCircle size={11} style={{ color: '#22c55e' }}/>
              {savedAt}
            </span>
          )}

          {/* Divider */}
          <div className="w-px mx-1" style={{ height: 20, background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }}/>

          {/* Guardar */}
          <button onClick={handleSaveHtmlFile} aria-label="Guardar archivo HTML"
            className="nb-btn nb-btn-muted">
            <Save size={13}/>
            Guardar
          </button>

          {/* Vista Previa */}
          <button onClick={() => setPreviewMode(!previewMode)}
            className={`nb-btn ${previewMode ? 'nb-btn-primary' : 'nb-btn-accent'}`}>
            <Eye size={13}/>
            {previewMode ? 'Editar' : 'Vista Previa'}
          </button>

          {/* Viewport toggles (preview mode only) */}
          {previewMode && (
            <>
              <div className="w-px mx-1" style={{ height: 20, background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }}/>
              <button onClick={() => setPreviewViewport('desktop')} title="Desktop" className={`nb-btn nb-btn-icon ${previewViewport === 'desktop' ? 'nb-btn-accent' : 'nb-btn-muted'}`}><Monitor size={13}/></button>
              <button onClick={() => setPreviewViewport('tablet')} title="Tablet" className={`nb-btn nb-btn-icon ${previewViewport === 'tablet' ? 'nb-btn-accent' : 'nb-btn-muted'}`}><Tablet size={13}/></button>
              <button onClick={() => setPreviewViewport('mobile')} title="Mobile" className={`nb-btn nb-btn-icon ${previewViewport === 'mobile' ? 'nb-btn-accent' : 'nb-btn-muted'}`}><Smartphone size={13}/></button>
            </>
          )}

          {/* Generar HTML — only filled solid button */}
          <button onClick={handleExportHtml} className="nb-btn nb-btn-primary">
            <Code size={13}/>
            Generar HTML
          </button>

          <ClipboardIndicator/>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {!previewMode && !leftOpen && (
          <button onClick={() => setLeftOpen(true)} title="Mostrar biblioteca" aria-label="Mostrar panel de componentes"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-2 rounded-r-xl transition-all"
            style={{ background: 'var(--color-sidebar)', color: 'var(--color-text-active)', boxShadow: 'var(--neu-dark-out)' }}>
            <PanelLeftOpen size={18}/>
          </button>
        )}
        {!previewMode && leftOpen && (
          <div className="sidebar-scroll flex flex-col z-40 overflow-y-auto flex-shrink-0"
            style={{ width: 240, background: 'var(--color-sidebar)', borderRight: '1px solid color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>

            {/* Search + collapse */}
            <div className="px-2.5 pt-3 pb-2 sticky top-0 z-10 flex items-center gap-2"
              style={{ background: 'var(--color-sidebar)' }}>
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(165,180,252,0.6)' }}/>
                <input
                  type="text"
                  placeholder="Buscar componente..."
                  aria-label="Buscar componente"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="neu-search"
                />
              </div>
              <button onClick={() => setLeftOpen(false)} title="Ocultar biblioteca" aria-label="Ocultar panel"
                className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(165,180,252,0.8)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-active)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(165,180,252,0.8)')}>
                <PanelLeftClose size={15}/>
              </button>
            </div>

            {/* Categories + widget grid */}
            <div className="px-2.5 pb-4 flex flex-col gap-1">
              {searchQuery.trim() ? (
                filteredWidgets.length > 0 ? (
                  <div className="mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-2 py-1" style={{ color: 'var(--color-accent)' }}>
                      {filteredWidgets.length} resultado{filteredWidgets.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredWidgets.map((w) => (<WidgetButton key={w.type} icon={w.icon} label={w.label} type={w.type} iconColor={CAT_COLORS[w.category]} onDragStart={handleDragStartFromSidebar} onClick={w.onClick}/>))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Search size={26} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-sidebar)' }}/>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-label)' }}>Sin resultados para "{searchQuery}"</p>
                  </div>
                )
              ) : (
                categories.map((cat) => {
                  const widgets = allWidgets.filter(w => w.category === cat.key);
                  if (widgets.length === 0) return null;
                  return (
                    <div key={cat.key} className="mb-2">
                      <button
                        onClick={() => toggleCategory(cat.key)}
                        className="flex items-center justify-between w-full py-1 mb-2 transition-colors"
                        style={{ color: 'var(--color-text-active)' }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{cat.key}</span>
                        <ChevronDown size={11} style={{ transform: collapsedCategories.has(cat.key) ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms', color: 'rgba(165,180,252,0.5)' }}/>
                      </button>
                      {!collapsedCategories.has(cat.key) && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {widgets.map((w) => (
                            <WidgetButton key={w.type} icon={w.icon} label={w.label} type={w.type} iconColor={CAT_COLORS[w.category]} onDragStart={handleDragStartFromSidebar} onClick={w.onClick}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {previewMode && (
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-3 py-2 text-xs font-bold text-white pointer-events-none"
            style={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-sidebar))' }}>
            <Eye size={13}/>
            <span>VISTA PREVIA — Así se verá el contenido en Moodle</span>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto p-6 relative ${previewMode ? 'flex justify-center pt-10' : 'edit-canvas'}`}
          style={{ background: darkMode ? 'var(--codex-dark-app)' : 'var(--color-app-bg)' }}
          onClick={() => setSelectedBlockId(null)}>
          <div className={`min-h-full pb-20 ${previewMode ? 'w-full max-w-6xl' : 'flex justify-center'}`}>
            <div className={`w-full min-h-[800px] flex flex-col transition-all duration-300
              ${previewMode && previewViewport === 'desktop' ? 'max-w-5xl' : ''}
              ${previewMode && previewViewport === 'tablet' ? 'max-w-[768px]' : ''}
              ${previewMode && previewViewport === 'mobile' ? 'max-w-[375px]' : ''}
              ${!previewMode ? 'max-w-5xl rounded-xl' : ''}
              ${draggedType ? "ring-2 ring-[var(--color-accent)] ring-offset-4" : ""}`}
              style={{
                background: darkMode ? 'var(--codex-dark-canvas)' : 'var(--color-canvas)',
                boxShadow: darkMode ? 'var(--neu-dark-out)' : 'var(--neu-canvas)',
                padding: previewMode ? (previewViewport === 'mobile' ? '8px' : previewViewport === 'tablet' ? '24px' : '48px') : '48px',
              }}
              onDragOver={(e) => !previewMode && handleDragOver(e, blocks.length)}
              onDrop={(e) => !previewMode && handleDrop(e, blocks.length)}>
              {blocks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center select-none pointer-events-none py-16">
                  {/* Logo grande en empty state */}
                  <div className="mb-8">
                    <img src={darkMode ? iconCodex : iconCodexClaro} alt="" width="72" height="72"/>
                  </div>
                  <h3 className={`text-2xl font-black mb-2 tracking-tight ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>C0deX</h3>
                  <p className={`text-sm mb-10 text-center max-w-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Diseña contenido educativo profesional para tu campus virtual de forma visual</p>

                  {/* Tres pasos */}
                  <div className="flex items-start gap-6 max-w-xl">
                    {[
                      { step: '1', title: 'Arrastra', desc: 'Selecciona componentes del panel izquierdo' },
                      { step: '2', title: 'Personaliza', desc: 'Edita propiedades en el panel derecho' },
                      { step: '3', title: 'Exporta', desc: 'Genera el HTML listo para Moodle' },
                    ].map((s, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 font-black"
                          style={{ background: i === 2 ? '#6366F1' : 'var(--color-surface-light)', color: i === 2 ? 'white' : 'var(--color-text-primary)', boxShadow: i === 2 ? '0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent)' : 'var(--neu-light-out)' }}>
                          {s.step}
                        </div>
                        <p className="text-xs font-bold text-gray-700 mb-1">{s.title}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{s.desc}</p>
                        {i < 2 && <div className="absolute" />}
                      </div>
                    ))}
                  </div>

                  {/* Flecha sugerida */}
                  <div className="mt-10 flex items-center gap-2 animate-pulse" style={{ color: 'var(--color-accent)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 17L17 7M17 7H7M17 7v10"/>
                    </svg>
                    <span className="text-xs font-bold">Comienza arrastrando un componente</span>
                  </div>
                </div>
              ) : (
                <>
                  {blocks.map((block, index) => (
                    <React.Fragment key={block.id}>
                      {!previewMode && index === 0 && (
                        <InlineAddButton index={0} onAdd={(type) => addBlock(type, 0)} darkMode={darkMode}/>
                      )}
                      <BlockRenderer block={block} index={index} selectedId={!previewMode ? selectedBlockId : null} onSelect={setSelectedBlockId} onDelete={deleteBlock} onDuplicate={duplicateBlock} onDuplicateSection={duplicateSection} onMoveUp={(id) => moveBlock(id, 'up')} onMoveDown={(id) => moveBlock(id, 'down')} isFirstBlock={index === 0} isLastBlock={index === blocks.length - 1} darkMode={darkMode} onDragStart={handleDragStartFromCanvas} onDragOver={handleDragOver} onDrop={handleDrop} dropTarget={dropTarget} preview={previewMode} onInsertBlock={insertBlockAt}/>
                      {!previewMode && (
                        <InlineAddButton index={index + 1} onAdd={(type) => addBlock(type, index + 1)} darkMode={darkMode}/>
                      )}
                    </React.Fragment>
                  ))}
                  {!previewMode && dropTarget?.index === blocks.length && !dropTarget?.parentId && (
                    <div className="flex items-center gap-2 my-1.5 px-1">
                      <div className="h-0.5 flex-1 rounded-full" style={{ background: 'var(--color-accent)' }} />
                      <div className="shrink-0 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'var(--color-accent)' }}><ArrowDown size={9}/> soltar aquí</div>
                      <div className="h-0.5 flex-1 rounded-full" style={{ background: 'var(--color-accent)' }} />
                    </div>
                  )}
                  {!previewMode && (
                    <div className="flex flex-col items-center gap-3 mt-8">
                      <CanvasPasteButton onPasteBlock={(block) => {
                        const loc = selectedBlockId ? findBlockLocation(selectedBlockId, blocks) : null;
                        const insertIdx = (loc && !loc.parentId) ? loc.index + 1 : blocks.length;
                        insertBlockAt(block, insertIdx);
                      }} />
                      <div className="h-24 w-full flex flex-col items-center justify-center transition-all cursor-default rounded-[10px] py-5"
                        style={{ border: '1.5px dashed color-mix(in srgb, var(--color-accent) 40%, transparent)', color: 'var(--color-text-active)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--color-accent) 4%, transparent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--color-accent) 40%, transparent)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                        onDragOver={(e) => handleDragOver(e, blocks.length)} onDrop={(e) => handleDrop(e, blocks.length)}>
                        <Plus size={24} className="mb-1.5 opacity-60"/>
                        <span className="text-xs font-semibold">Suelta aquí para añadir al final</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {!previewMode && !rightOpen && (
          <button onClick={() => setRightOpen(true)} title="Mostrar propiedades" aria-label="Mostrar propiedades"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-2 rounded-l-xl transition-colors"
            style={{ background: 'var(--color-sidebar)', color: 'var(--color-text-active)' }}>
            <PanelRightOpen size={18}/>
          </button>
        )}
        {!previewMode && rightOpen && (
          <div
            className="flex-shrink-0 cursor-col-resize z-50 flex items-center justify-center group"
            style={{ width: 8 }}
            onMouseDown={e => {
              e.preventDefault();
              rightResizingRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
              const onMove = (ev: MouseEvent) => {
                if (!rightResizingRef.current) return;
                const delta = rightResizingRef.current.startX - ev.clientX;
                setRightPanelWidth(Math.min(700, Math.max(280, rightResizingRef.current.startWidth + delta)));
              };
              const onUp = () => {
                rightResizingRef.current = null;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            <div className="w-1 h-12 rounded-full transition-all group-hover:h-20 group-hover:opacity-100 opacity-30" style={{ background: 'var(--color-accent)' }}/>
          </div>
        )}
        {!previewMode && rightOpen && (
          <div className="flex flex-col z-40 flex-shrink-0"
            style={{ width: rightPanelWidth, background: darkMode ? 'var(--color-sidebar)' : 'var(--color-surface-light)', borderLeft: '1px solid color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
            <div className="flex justify-end px-3 pt-2">
              <button onClick={() => setRightOpen(false)} title="Ocultar propiedades" aria-label="Ocultar propiedades"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                <PanelRightClose size={15}/>
              </button>
            </div>
            <PropertiesPanel block={selectedBlock} onUpdate={updateBlock} darkMode={darkMode}/>
          </div>
        )}
      </div>

      <TemplatesModal
        show={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onLoad={loadBuiltInTemplate}
        onImport={handleImportTemplate}
      />
      <LayoutModal
        show={showLayoutModal}
        onClose={() => { setShowLayoutModal(false); setPendingLayoutIndex(null); setPendingLayoutParentId(undefined); setPendingLayoutColId(undefined); }}
        onSelect={addLayoutBlock}
      />
      <HtmlModal
        show={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        initialHtml={generatedHtml}
      />
      {deleteToast && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white" style={{ background: 'var(--color-sidebar)' }}>
          <Trash2 size={13}/>
          Bloque eliminado
          <button onClick={() => { undo(); setDeleteToast(false); }} className="underline decoration-dotted hover:text-blue-200 transition-colors">Deshacer (Ctrl+Z)</button>
        </div>
      )}
    </div>
    </ClipboardProvider>
  );
};
export default App;
