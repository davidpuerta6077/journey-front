import React, { useRef, useState } from 'react';
import { BlockData, BlockType } from '../types';
import {
  Trash2, Copy, CopyPlus, ArrowUp, ArrowDown, GripVertical, Columns, ChevronDown, ChevronUp,
  Info, Play, Headphones, MessageSquare, CheckCheck,
  CheckSquare, User, Users, Map, Plus, CheckCircle, XCircle,
  Clipboard, ClipboardPaste, X
} from 'lucide-react-codex';
import { NestedArea } from './NestedArea';
import { useClipboard, cloneFromClipboard } from './ClipboardContext';

interface BlockRendererProps {
  block: BlockData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateSection?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirstBlock?: boolean;
  isLastBlock?: boolean;
  darkMode?: boolean;
  isNested?: boolean;
  index: number;
  parentId?: string;
  columnId?: string;
  onDragStart: (e: React.DragEvent, index: number, id: string, parentId?: string, colId?: string) => void;
  onDragOver: (e: React.DragEvent, index: number, parentId?: string, colId?: string) => void;
  onDrop: (e: React.DragEvent, index: number, parentId?: string, colId?: string) => void;
  dropTarget: { index: number | null, parentId: string | undefined, colId: string | undefined } | null;
  preview?: boolean;
  // ✅ NUEVO: callback para insertar un bloque copiado en un área anidada
  onInsertBlock?: (block: BlockData, index: number, parentId: string, areaId: string) => void;
}

const BLOCK_LABELS: Partial<Record<BlockType, string>> = {
  [BlockType.HEADING]: 'Título', [BlockType.TEXT]: 'Texto', [BlockType.IMAGE]: 'Imagen',
  [BlockType.VIDEO]: 'Video', [BlockType.TABLE]: 'Tabla', [BlockType.ALERT]: 'Alerta',
  [BlockType.BUTTON]: 'Botón', [BlockType.LAYOUT]: 'Columnas', [BlockType.ACCORDION]: 'Acordeón',
  [BlockType.FLIPCARD]: 'Flip Card', [BlockType.ICON_CARD]: 'Tarjeta', [BlockType.CONCLUSION]: 'Contenedor',
  [BlockType.PODCAST]: 'Pódcast', [BlockType.TABS]: 'Tabs', [BlockType.CITATION]: 'Icono+Texto',
  [BlockType.TASK]: 'Tarea', [BlockType.FORUM]: 'Foro', [BlockType.SABER_COLUMNS]: 'Cols.Saber',
  [BlockType.QUESTIONNAIRE]: 'Cuestionario', [BlockType.MODAL]: 'Modal', [BlockType.POPOVER]: 'Popover',
  [BlockType.QUIZ]: 'Pregunta', [BlockType.TIMELINE]: 'Timeline', [BlockType.STAT_CARD]: 'Estadísticas',
  [BlockType.SECTION_BANNER]: 'Banner', [BlockType.BLOCKQUOTE]: 'Cita', [BlockType.DOWNLOAD_CARD]: 'Descarga',
  [BlockType.CODE_BLOCK]: 'Código', [BlockType.COLLAPSE_ICON]: 'Colapso', [BlockType.CARD_IMAGE]: 'Card Img',
  [BlockType.INTRO_CARD]: 'Intro', [BlockType.DIVIDER]: 'Separador',
};

const BLOCK_HINTS: Partial<Record<BlockType, string>> = {
  [BlockType.TEXT]:           'Selecciona este bloque → escribe en el editor del panel Propiedades (derecha)',
  [BlockType.IMAGE]:          'Selecciona → pega o escribe la URL de la imagen en Propiedades',
  [BlockType.VIDEO]:          'Selecciona → pega la URL del video (YouTube, Vimeo, etc.) en Propiedades',
  [BlockType.PODCAST]:        'Selecciona → pega la URL del archivo de audio (.mp3, .ogg…) en Propiedades',
  [BlockType.QUIZ]:           'Selecciona → escribe la pregunta, define las opciones y marca la correcta en Propiedades',
  [BlockType.MODAL]:          'Selecciona → configura el texto del botón y el contenido de la ventana en Propiedades',
  [BlockType.POPOVER]:        'Selecciona → escribe el texto de la pista flotante en Propiedades',
  [BlockType.FLIPCARD]:       'Selecciona → sube las imágenes de frente y reverso en Propiedades',
  [BlockType.ICON_CARD]:      'Selecciona → edita el título, descripción e ícono FontAwesome en Propiedades',
  [BlockType.TIMELINE]:       'Selecciona → agrega etapas con título, fecha y descripción en Propiedades',
  [BlockType.STAT_CARD]:      'Selecciona → configura cifras, etiquetas e íconos de cada estadística en Propiedades',
  [BlockType.SECTION_BANNER]: 'Selecciona → edita el título, subtítulo e ícono del banner en Propiedades',
  [BlockType.BLOCKQUOTE]:     'Selecciona → escribe la cita, el autor y la fuente en Propiedades',
  [BlockType.CODE_BLOCK]:     'Selecciona → escribe o pega el código y elige el lenguaje en Propiedades',
  [BlockType.COLLAPSE_ICON]:  'Selecciona → sube el ícono y escribe el contenido colapsable en Propiedades',
  [BlockType.CARD_IMAGE]:     'Selecciona → sube la imagen y edita los puntos clave en Propiedades',
  [BlockType.DOWNLOAD_CARD]:  'Selecciona → agrega archivos con nombre, tipo y URL de descarga en Propiedades',
  [BlockType.ALERT]:          'Arrastra bloques (Texto, Imagen…) al interior de esta caja ↓',
  [BlockType.CONCLUSION]:     'Arrastra bloques (Texto, Imagen…) al área de contenido ↓',
  [BlockType.TASK]:           'Arrastra bloques al área Itinerario (pasos) y al área Evaluación (criterios) ↓',
  [BlockType.CITATION]:       'Selecciona → configura el ícono en Propiedades · Arrastra bloques al área de texto ↓',
  [BlockType.FORUM]:          'Selecciona → edita el título del foro en Propiedades · Arrastra bloques de instrucción al área ↓',
  [BlockType.QUESTIONNAIRE]:  'Selecciona → edita el título en Propiedades · Arrastra bloques de pregunta al área ↓',
  [BlockType.INTRO_CARD]:     'Selecciona → configura la imagen en Propiedades · Arrastra bloques al área de contenido ↓',
  [BlockType.ACCORDION]:      'Arrastra bloques a cada sección ↓ · Agrega o renombra secciones en Propiedades',
  [BlockType.TABS]:           'Arrastra bloques a cada pestaña ↓ · Agrega o renombra pestañas en Propiedades',
  [BlockType.LAYOUT]:         'Arrastra bloques a cada columna ↓',
  [BlockType.SABER_COLUMNS]:  'Arrastra bloques a cada columna del layout Saber ↓',
};

function isBlockEmpty(block: BlockData): boolean {
  const c = block.content as any;
  const allAreasEmpty = (areas: BlockData['areas']) =>
    !areas || Object.values(areas).every(
      arr => arr.length === 0 || (arr.length === 1 && !(arr[0]?.content as any)?.text)
    );
  switch (block.type) {
    case BlockType.TEXT:
    case BlockType.BLOCKQUOTE:
    case BlockType.MODAL:
    case BlockType.POPOVER:       return !c.text;
    case BlockType.VIDEO:
    case BlockType.PODCAST:       return !c.url;
    case BlockType.QUIZ:          return !c.question;
    case BlockType.ICON_CARD:     return !c.text;
    case BlockType.SECTION_BANNER:return !c.subtitle;
    case BlockType.COLLAPSE_ICON: return !c.contentText;
    case BlockType.TIMELINE:      return (c.items as any[])?.every((i: any) => !i.text) ?? true;
    case BlockType.STAT_CARD:     return (c.items as any[])?.every((i: any) => !i.label) ?? true;
    case BlockType.CARD_IMAGE:    return (c.items as any[])?.every((i: any) => !i.text) ?? true;
    case BlockType.ALERT:
    case BlockType.CONCLUSION:
    case BlockType.CITATION:
    case BlockType.FORUM:
    case BlockType.QUESTIONNAIRE:
    case BlockType.INTRO_CARD:
    case BlockType.TASK:
    case BlockType.ACCORDION:
    case BlockType.TABS:          return allAreasEmpty(block.areas);
    case BlockType.LAYOUT:
    case BlockType.SABER_COLUMNS: return !block.columns || block.columns.every(col => col.blocks.length === 0);
    default:                      return false;
  }
}

// ✅ buildNestedAreaProps ahora incluye onInsertBlock
const buildNestedAreaProps = (props: BlockRendererProps) => ({
  selectedId: props.selectedId,
  onSelect: props.onSelect,
  onDelete: props.onDelete,
  onDuplicate: props.onDuplicate,
  onDuplicateSection: props.onDuplicateSection,
  onMoveUp: props.onMoveUp,
  onMoveDown: props.onMoveDown,
  onDragStart: props.onDragStart,
  onDragOver: props.onDragOver,
  onDrop: props.onDrop,
  dropTarget: props.dropTarget,
  darkMode: props.darkMode,
  preview: props.preview,
  BlockRendererComponent: BlockRenderer,
  onInsertBlock: props.onInsertBlock,   // ✅ propagado a NestedArea
});

export const BlockRenderer: React.FC<BlockRendererProps> = (props) => {
  const { block, selectedId, onSelect, onDelete, onDuplicate, onDuplicateSection, 
    onMoveUp, onMoveDown, isFirstBlock, isLastBlock, darkMode = false, isNested = false,
    index, parentId, columnId, onDragStart, onDragOver, onDrop, dropTarget, preview = false,
    onInsertBlock } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizSelected, setQuizSelected] = useState<string>('');
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [collapseOpen, setCollapseOpen] = useState(true);

  // ✅ Hook de portapapeles
  const { copyBlock, hasCopied, clipboard } = useClipboard();

  const isSelected = block.id === selectedId;
  const isDropTarget = dropTarget && dropTarget.index === index && dropTarget.parentId === parentId && dropTarget.colId === columnId;

  const nestedAreaProps = buildNestedAreaProps(props);

  const renderContent = () => {
    switch (block.type) {
        
      case BlockType.QUIZ:
        const isCorrect = quizSelected === block.content.correctValue;
        return (
          <div className={`p-6 border rounded-lg bg-white shadow-sm quiz-container ${!preview ? 'pointer-events-auto' : ''}`}>
                          <div className="mb-6 moodle-content" dangerouslySetInnerHTML={{ __html: block.content.question || '' }} />
             <div className="space-y-3 mb-6">
                {block.content.options?.map((opt: any, idx: number) => (
                   <label key={idx} className="flex items-start gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                      <input type="radio" name={`quiz-${block.id}`} value={opt.value} className="mt-1.5 shrink-0 w-4 h-4 text-blue-600"
                        checked={quizSelected === opt.value} onChange={(e) => { if (!quizSubmitted) setQuizSelected(e.target.value); }} disabled={quizSubmitted}
                      /> 
                      <div className="text-gray-700 moodle-content text-sm" dangerouslySetInnerHTML={{ __html: opt.label }} />
                   </label>
                ))}
             </div>
             <div className="feedback-area mb-4">
                {quizSubmitted && (
                   <div className={`p-4 rounded border ${isCorrect ? 'bg-[#d4edda] border-[#c3e6cb] text-[#155724]' : 'bg-[#f8d7da] border-[#f5c6cb] text-[#721c24]'}`}>
                      <div className="font-bold flex items-center gap-2 mb-2">
                         {isCorrect ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                         {isCorrect ? (block.content.correctLabel || '¡Correcto!') : (block.content.incorrectLabel || 'Respuesta incorrecta.')}
                      </div>
                      <div className="text-sm moodle-content leading-relaxed" dangerouslySetInnerHTML={{ __html: isCorrect ? block.content.feedbackPositive || '' : block.content.feedbackNegative || '' }} />
                   </div>
                )}
             </div>
             {!quizSubmitted ? (
                 <button onClick={(e) => { e.stopPropagation(); if(quizSelected) setQuizSubmitted(true); }} disabled={!quizSelected}
                    className={`px-5 py-2 rounded text-white font-bold text-sm transition-colors shadow-sm ${quizSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                    {block.content.submitText || 'Enviar'}
                 </button>
             ) : (
                 <button onClick={(e) => { e.stopPropagation(); setQuizSubmitted(false); setQuizSelected(''); }}
                    className="px-4 py-2 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-100 transition-colors">
                    Reiniciar (Solo vista previa)
                 </button>
             )}
          </div>
        );

      case BlockType.LAYOUT:
        return (
          <div className="flex flex-wrap w-full -mx-2">
                        {block.columns?.map((col) => (
              <div key={col.id} style={{ width: col.width }} className="px-2 mb-4 shrink-0">
                <div className={`h-full flex flex-col transition-all
                     ${!preview ? 'border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50/50 min-h-[120px]' : ''}
                     ${!preview && (dropTarget?.parentId === block.id && dropTarget?.colId === col.id) ? 'border-blue-400 bg-blue-50' : ''}`}
                   onDragOver={(e) => { if (!preview) onDragOver(e, col.blocks.length, block.id, col.id); }}
                   onDrop={(e) => { if (!preview) onDrop(e, col.blocks.length, block.id, col.id); }}
                >
                  {!preview && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-400 font-bold">{parseInt(col.width)}%</span>
                      {hasCopied && clipboard && onInsertBlock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onInsertBlock(cloneFromClipboard(clipboard), col.blocks.length, block.id, col.id); }}
                          className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors"
                          title="Pegar al final de esta columna"
                        >
                          <ClipboardPaste size={10} />
                          Pegar
                        </button>
                      )}
                    </div>
                  )}
                  {!preview && col.blocks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-4">
                      <Columns size={24} className="mb-1 opacity-50"/>
                      <span className="text-xs font-semibold">Arrastra aquí</span>
                    </div>
                  )}
                  {col.blocks.map((childBlock, childIndex) => (
                    <BlockRenderer key={childBlock.id} block={childBlock} index={childIndex} parentId={block.id} columnId={col.id}
                        selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate}
                        onDuplicateSection={onDuplicateSection} onMoveUp={onMoveUp} onMoveDown={onMoveDown}
                        isFirstBlock={childIndex === 0} isLastBlock={childIndex === col.blocks.length - 1}
                        onDragStart={onDragStart} onDragOver={onDragOver}
                        onDrop={onDrop} dropTarget={dropTarget} darkMode={darkMode} preview={preview} isNested={true}
                        onInsertBlock={onInsertBlock}
                    />
                  ))}
                  {!preview && dropTarget?.parentId === block.id && dropTarget?.colId === col.id && dropTarget?.index === col.blocks.length && (
                      <div className="h-1 bg-blue-500 rounded-full my-1 animate-pulse w-full" />
                  )}
                  <div className={`flex-grow min-h-[20px] ${preview ? 'hidden' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        );

      case BlockType.SABER_COLUMNS:
        return (
           <div className="flex flex-col md:flex-row gap-4 w-full">
              {block.columns?.map((col, idx) => (
                  <div key={col.id} className="w-full md:w-1/2 flex flex-col">
                     {!preview && (
                        <div className="flex items-center justify-between text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">
                          <span>{idx === 0 ? 'Col. Izquierda' : 'Col. Derecha'}</span>
                          {hasCopied && clipboard && onInsertBlock && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onInsertBlock(cloneFromClipboard(clipboard), col.blocks.length, block.id, col.id); }}
                              className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors normal-case tracking-normal"
                              title="Pegar al final de esta columna"
                            >
                              <ClipboardPaste size={10} />
                              Pegar
                            </button>
                          )}
                        </div>
                     )}
                     <div className={`h-full flex flex-col p-4 border rounded-lg shadow-sm bg-white
                            ${!preview ? 'border-dashed border-gray-300 min-h-[150px]' : 'border-gray-200'}
                            ${!preview && (dropTarget?.parentId === block.id && dropTarget?.colId === col.id) ? 'bg-blue-50 border-blue-400' : ''}`}
                        onDragOver={(e) => { if (!preview) onDragOver(e, col.blocks.length, block.id, col.id); }} 
                        onDrop={(e) => { if (!preview) onDrop(e, col.blocks.length, block.id, col.id); }}
                     >
                        {col.blocks.map((childBlock, childIndex) => (
                            <BlockRenderer key={childBlock.id} block={childBlock} index={childIndex} parentId={block.id} columnId={col.id}
                                selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate}
                                onDuplicateSection={onDuplicateSection} onMoveUp={onMoveUp} onMoveDown={onMoveDown}
                                isFirstBlock={childIndex === 0} isLastBlock={childIndex === col.blocks.length - 1}
                                onDragStart={onDragStart} onDragOver={onDragOver}
                                onDrop={onDrop} dropTarget={dropTarget} darkMode={darkMode} preview={preview} isNested={true}
                                onInsertBlock={onInsertBlock}
                            />
                        ))}
                        {!preview && col.blocks.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-6">
                                <Plus size={24} className="mb-2"/>
                                <span className="text-xs">Arrastra contenido aquí</span>
                            </div>
                        )}
                     </div>
                  </div>
              ))}
           </div>
        );

case BlockType.HEADING: {
  const HeadingTag = (block.content.level || 'h2') as any;

  // Mapa de clases Bootstrap → color inline para el canvas
  const colorMap: Record<string, string> = {
    'text-primary':  '#2563eb',
    'text-info':     '#07b3c1',
    'text-success':  '#16a34a',
    'text-danger':   '#dc2626',
    'text-warning':  '#eab308',
    'text-purple':   '#5a31b5',
    'text-orange':   '#e0421f',
    'text-dark':     '#212529',
    'text-white':    '#ffffff',
  };

  const bgColorMap: Record<string, string> = {
    'bg-primary':  '#2563eb',
    'bg-info':     '#07b3c1',
    'bg-purple':   '#5a31b5',
    'bg-orange':   '#e0421f',
    'bg-success':  '#16a34a',
    'bg-warning':  '#eab308',
    'bg-danger':   '#dc2626',
    'bg-secondary':'#6c757d',
  };

  const colorClass = block.content.colorClass || '';
  const inlineColor = colorMap[colorClass];
  const inlineBg = bgColorMap[colorClass];

const headingStyle: React.CSSProperties = {
  color: inlineColor || '#013549',
  textAlign: (block.style.textAlign as any) || 'left',
  ...(inlineBg ? {
    backgroundColor: inlineBg,
    color: '#ffffff',
    padding: '2px 10px',
    borderRadius: '4px',
    display: 'inline-block',
  } : {}),
};

  const accentColor = inlineColor || '#013549';
  return (
    <div>
      <HeadingTag className={`${({'bold':'font-bold','semibold':'font-semibold','normal':'font-normal'} as Record<string,string>)[block.content.fontWeight||'bold']||'font-bold'} mb-1 mt-6 moodle-content`} style={headingStyle}>
        {block.content.text}
      </HeadingTag>
      {block.content.showDivider && (
        <div style={{ height: '3px', width: '60px', backgroundColor: accentColor, borderRadius: '2px', marginBottom: '12px' }} />
      )}
    </div>
  );
}

      case BlockType.TEXT:
        return (
            <div className="w-full max-w-none">                <div dangerouslySetInnerHTML={{ __html: block.content.text || '' }} className={`moodle-content ${!preview ? 'pointer-events-none' : ''}`} />
            </div>
        );

      case BlockType.TABLE:
        return (
            <div className={`overflow-x-auto p-1 w-full moodle-content ${!preview ? 'pointer-events-none' : ''}`}>
                                <div dangerouslySetInnerHTML={{ __html: block.content.text || '' }} className="w-full" />
            </div>
        );

      case BlockType.IMAGE: {
        const imgStyleMap: Record<string, React.CSSProperties> = {
          normal: {},
          rounded: { borderRadius: '8px' },
          circle: { borderRadius: '50%' },
          thumbnail: { borderRadius: '8px', border: '1px solid #dee2e6', padding: '4px', backgroundColor: '#fff' },
        };
        const align = block.style.textAlign || 'center';
        const wrapStyle: React.CSSProperties = align === 'left' ? { float: 'left', marginRight: '16px' }
          : align === 'right' ? { float: 'right', marginLeft: '16px' }
          : { textAlign: 'center' };
        const imgModalOn = block.content.modalEnabled === true;
        return (
          <div>
            <div className={!preview ? 'pointer-events-none' : ''} style={wrapStyle}>
              <img src={block.content.src} alt={block.content.alt} className={`max-w-full h-auto ${block.content.showShadow !== false ? 'shadow' : ''} ${imgModalOn ? 'cursor-pointer' : ''}`} style={{ ...imgStyleMap[block.content.imageStyle || 'rounded'], ...(block.content.width ? { width: block.content.width } : {}), ...(block.content.height ? { height: block.content.height } : {}) }} />
              {block.content.caption && <div className="text-sm text-gray-500 mt-2 italic" style={{ clear: 'both' }}>{block.content.caption}</div>}
              {!imgModalOn && block.content.lightbox && <span className="text-[10px] uppercase tracking-wide text-blue-600 mt-1 inline-block" style={{ clear: 'both' }}>🔍 Lightbox activo</span>}
              {imgModalOn && <span className="text-[10px] uppercase tracking-wide text-purple-600 mt-1 inline-block" style={{ clear: 'both' }}>🗔 Modal activo</span>}
            </div>
            {imgModalOn && !preview && (
              <div className="mt-3" style={{ clear: 'both' }}>
                <NestedArea {...nestedAreaProps} blocks={block.areas?.modal || []} parentId={block.id} areaId="modal" label={`Contenido del Modal${block.content.modalTitle ? `: ${block.content.modalTitle}` : ''}`} />
              </div>
            )}
          </div>
        );
      }
      
      case BlockType.VIDEO: {
         let videoId = block.content.url || '';
         if (videoId.includes('v=')) videoId = videoId.split('v=')[1]?.split('&')[0];
         else if (videoId.includes('youtu.be/')) videoId = videoId.split('youtu.be/')[1]?.split('?')[0];
         else if (videoId.includes('embed/')) videoId = videoId.split('embed/')[1]?.split('?')[0];
         const embedUrl = `https://www.youtube.com/embed/${videoId}`;
         const videoPb = block.content.ratio === '4:3' ? '75%' : block.content.ratio === '1:1' ? '100%' : '56.25%';
         return (<div className={`relative w-full bg-black rounded-lg overflow-hidden ${!preview ? 'pointer-events-none' : ''}`} style={{ paddingBottom: videoPb }}>
             {videoId ? (<iframe src={embedUrl} className="absolute inset-0 w-full h-full" title="Video Preview" />) : (<div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">NO VIDEO URL</div>)}
         </div>);
      }
      
      case BlockType.ALERT: {
        const themeStyles: Record<string, string> = { 'purple': 'bg-[#f0ebfa] text-[#5a31b5] border-[#c1afe9]', 'orange': 'bg-[#ffeae6] text-[#e0421f] border-[#ffbfb3]', 'blue': 'bg-[#eaf4fc] text-[#065cc2] border-[#cfe2ff]', 'yellow': 'bg-[#fff3cd] text-[#856404] border-[#ffecb5]', 'success': 'bg-[#f7faea] text-[#829922] border-[#d8e896]', 'info': 'bg-[#eaf8fa] text-[#07b3c1] border-[#ade3eb]', 'secondary': 'bg-[#f2f2f2] text-[#333] border-[#d9d9d9]' };
        const headerBgHex: Record<string, string> = { 'purple': '#5a31b5', 'orange': '#e0421f', 'blue': '#065cc2', 'yellow': '#856404', 'success': '#829922', 'info': '#07b3c1', 'secondary': '#6c757d' };
        const borderHex: Record<string, string> = { 'purple': '#c1afe9', 'orange': '#ffbfb3', 'blue': '#cfe2ff', 'yellow': '#ffecb5', 'success': '#d8e896', 'info': '#ade3eb', 'secondary': '#d9d9d9' };
        const textHex: Record<string, string> = { 'purple': '#5a31b5', 'orange': '#e0421f', 'blue': '#065cc2', 'yellow': '#856404', 'success': '#829922', 'info': '#07b3c1', 'secondary': '#333' };
        const alertType = block.content.type || 'info';
        const currentTheme = themeStyles[alertType] || themeStyles.info;
        const cardStyle = block.content.cardStyle || 'alert';
        const hasArea = block.areas?.content !== undefined;
        const bodyContent = hasArea && (!preview || block.areas!.content.length > 0) ? (
          <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Contenido" />
        ) : (
          <div className="moodle-content" dangerouslySetInnerHTML={{ __html: block.content.text || '' }} />
        );

        if (cardStyle === 'header_card') {
          const hBg = headerBgHex[alertType] || headerBgHex.info;
          return (<div className="border border-gray-300 rounded shadow-sm overflow-visible">
                            <div className="px-4 py-2 text-white font-bold flex items-center gap-2" style={{ backgroundColor: hBg }}><Info size={18}/> {block.content.headerTitle || 'Título'}</div>
              <div className="p-4 bg-white">{bodyContent}</div>
          </div>);
        } else if (cardStyle === 'banner') {
          const tHex = textHex[alertType] || textHex.info;
          return (<div className="flex bg-white rounded shadow-md border border-gray-100 p-2 items-center">
              <div className="w-1/6"><img src={block.content.imageUrl || 'https://placehold.co/150'} className="rounded w-full" alt=""/></div>
              <div className="w-5/6 pl-4 font-bold text-lg" style={{ color: tHex }}>{block.content.bannerText || block.content.text}</div>
          </div>);
        } else if (cardStyle === 'card') {
          const bHex = borderHex[alertType] || borderHex.info;
          const tHex = textHex[alertType] || textHex.info;
          return (<div className="bg-white rounded p-4 h-full overflow-visible" style={{ border: `2px solid ${bHex}`, color: tHex }}>
              {bodyContent}
          </div>);
        }
        return (<div className={`p-4 rounded-lg border overflow-visible ${currentTheme}`}>
            {bodyContent}
        </div>);
      }
      
      case BlockType.BUTTON: {
        const variant = block.content.variant || 'primary';
        const isFullWidth = block.content.isFullWidth !== false;
        const btnModalOn = block.content.modalEnabled === true;
        const outlinedStyles: Record<string,string> = { primary: 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white', info: 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white', warning: 'border-[#5a31b5] text-[#5a31b5] hover:bg-[#5a31b5] hover:text-white', success: 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white', secondary: 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white', danger: 'bg-[#1e2a6b] border-[#1e2a6b] text-[#ffe44e] hover:bg-[#ffe44e] hover:border-[#ffe44e] hover:text-[#1e2a6b]', orange: 'border-[#e45d3d] text-[#e45d3d] hover:bg-[#e45d3d] hover:text-white', dark: 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white', light: 'border-[#ffe44e] text-[#3a3aaa] hover:bg-[#ffe44e]' };
        const filledStyles: Record<string,string> = { primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700', info: 'bg-cyan-500 border-cyan-500 text-white hover:bg-cyan-600', warning: 'bg-[#5a31b5] border-[#5a31b5] text-white hover:bg-[#4a2696]', success: 'bg-green-600 border-green-600 text-white hover:bg-green-700', secondary: 'bg-gray-500 border-gray-500 text-white hover:bg-gray-600', danger: 'bg-[#1e2a6b] border-[#1e2a6b] text-[#ffe44e] hover:bg-[#ffe44e] hover:border-[#ffe44e] hover:text-[#1e2a6b]', orange: 'bg-[#e45d3d] border-[#e45d3d] text-white hover:bg-[#c94e31]', dark: 'bg-gray-800 border-gray-800 text-white hover:bg-gray-900', light: 'bg-[#ffe44e] border-[#ffe44e] text-[#3a3aaa] hover:bg-[#f5d800]' };
        const isSolid = block.content.isSolid === true;
        const styleClass = (isSolid ? filledStyles : outlinedStyles)[variant] || (isSolid ? filledStyles : outlinedStyles).primary;
        const isBold = block.content.isBold !== false;
        const badgeType = block.content.badgeType || 'none';
        const badgeColor = block.content.badgeColor || 'danger';
        const bsBadgeHex: Record<string,string> = { primary: '#0d6efd', secondary: '#6c757d', success: '#198754', danger: '#dc3545', warning: '#ffc107', info: '#0dcaf0', light: '#f8f9fa', dark: '#212529' };
        const badgeHex = bsBadgeHex[badgeColor] || bsBadgeHex.danger;
        const badgeTextColor = (badgeColor === 'warning' || badgeColor === 'light' || badgeColor === 'info') ? '#000' : '#fff';
        return (
          <div>
            <div className={`${isFullWidth ? 'block' : 'inline-block'} ${!preview ? 'pointer-events-none' : ''}`}>
              <span className={`relative inline-block ${badgeType === 'pill' || badgeType === 'dot' ? 'mt-2' : ''}`} style={isFullWidth ? { display: 'block' } : undefined}>
                <button className={`inline-flex items-center justify-center px-4 py-2 text-center rounded border-2 transition-colors ${isBold ? 'font-bold' : ''} ${styleClass} ${isFullWidth ? 'w-full block' : ''}`}>
                  {block.content.text}
                  {variant === 'danger' && <Plus size={16} className="ml-1.5" />}
                  {badgeType === 'inline' && <span className="ml-2 px-2 py-0.5 text-xs rounded align-middle" style={{ backgroundColor: badgeHex, color: badgeTextColor }}>{block.content.badgeText}</span>}
                </button>
                {badgeType === 'pill' && <span className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full whitespace-nowrap" style={{ backgroundColor: badgeHex, color: badgeTextColor }}>{block.content.badgeText}</span>}
                {badgeType === 'dot' && <span className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: badgeHex }} />}
              </span>
              {btnModalOn && <span className="text-[10px] uppercase tracking-wide text-purple-600 mt-1 inline-block">🗔 Modal activo</span>}
            </div>
            {btnModalOn && !preview && (
              <div className="mt-3">
                <NestedArea {...nestedAreaProps} blocks={block.areas?.modal || []} parentId={block.id} areaId="modal" label={`Contenido del Modal${block.content.modalTitle ? `: ${block.content.modalTitle}` : ''}`} />
              </div>
            )}
          </div>
        );
      }

      case BlockType.DIVIDER: {
        const dColorMap: Record<string,string> = { gray: '#d1d5db', dark: '#374151', primary: '#2563eb', info: '#07b3c1', success: '#16a34a', danger: '#dc2626', orange: '#e0421f', purple: '#5a31b5' };
        const dHex = dColorMap[block.content.dividerColor || 'gray'] || '#d1d5db';
        const dStyle = block.content.dividerStyle || 'solid';
        const dLabel = block.content.dividerLabel || '';
        if (dLabel) {
          return (
            <div className="flex items-center gap-3 my-4">
              <div style={{ flex: 1, borderTop: `1px ${dStyle} ${dHex}` }} />
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: dHex }}>{dLabel}</span>
              <div style={{ flex: 1, borderTop: `1px ${dStyle} ${dHex}` }} />
            </div>
          );
        }
        return <hr style={{ borderTop: `1px ${dStyle} ${dHex}`, margin: '16px 0' }} />;
      }

      case BlockType.ACCORDION:
        return (
            <div className={`rounded-xl overflow-visible ${block.content.showBorder !== false ? 'shadow-sm border border-gray-100' : ''}`}>
                                {block.content.items?.map((item: any, i: number) => {
                  const itemAreaId = item.id || `item-${i}`;
                  const areaBlocks = block.areas?.[itemAreaId];
                  const isOpen = !preview ? true : activeAccordion === i;
                  return (
                    <div key={i} className="mb-1 border-b border-gray-100 last:border-0 last:mb-0">
                        <div
                          className="text-white p-3 font-bold flex justify-between items-center cursor-pointer"
                          style={{ backgroundColor: ({'none':'#023649','blue':'#2563eb','dark':'#023649','primary':'#2563eb','info':'#07b3c1','purple':'#5a31b5','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d'} as Record<string,string>)[block.content.color||'none']||'#023649' }}
                          onClick={() => preview && setActiveAccordion(activeAccordion === i ? -1 : i)}
                        >
                            <span>{item.title}</span>
                            {preview
                              ? (isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)
                              : <span className="text-xs font-normal opacity-60">▼ siempre abierto en edición</span>
                            }
                        </div>
                        {isOpen && (
                          <div className="bg-white p-3 text-gray-800 border-l border-r border-b border-gray-100">
                            {areaBlocks !== undefined ? (
                              <NestedArea {...nestedAreaProps} blocks={areaBlocks} parentId={block.id} areaId={itemAreaId} label={`Sección: ${item.title}`} />
                            ) : (
                              <div className={`moodle-content ${!preview ? 'pointer-events-none' : ''}`} dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}
                {(!block.content.items || block.content.items.length === 0) && (
                  <div className="p-4 text-center text-gray-400 italic text-sm">Sin secciones — agrega desde el panel derecho</div>
                )}
            </div>
        );

      case BlockType.FLIPCARD:
         return (<div className="relative group w-full" style={{ aspectRatio: block.content.aspectRatio || '877/565' }}>
             <div className="w-full h-full transition-transform duration-700 relative" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} onClick={() => setIsFlipped(!isFlipped)}>
                 <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-md overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                     <img src={block.content.frontImage} alt="Imagen frontal de la tarjeta volteable" className="w-full h-full object-contain" />
                     {block.content.showFlipHint !== false && <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Clic para voltear</div>}
                 </div>
                 <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-md overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                     <img src={block.content.backImage} alt="Imagen reverso de la tarjeta volteable" className="w-full h-full object-contain" />
                 </div>
             </div>
         </div>);
      
      case BlockType.ICON_CARD: {
         const icColor = block.content.color || 'info';
         let icTextColor = 'text-[#07b3c1]'; 
         if(icColor === 'primary') icTextColor = 'text-[#2563eb]';
         else if(icColor === 'purple') icTextColor = 'text-[#5a31b5]';
         else if(icColor === 'orange') icTextColor = 'text-[#e0421f]';
         else if(icColor === 'success') icTextColor = 'text-[#16a34a]';
         else if(icColor === 'danger') icTextColor = 'text-[#dc2626]';
         else if(icColor === 'warning') icTextColor = 'text-[#eab308]';
         const iconPos = block.content.iconPosition || 'left';
         const iconSzMap: Record<string,number> = { sm: 32, md: 48, lg: 64 };
         const iconFontSz = iconSzMap[block.content.iconSize || 'md'] || 48;
         return (
             <div className={`h-full mb-4 bg-white shadow-sm border-0 ${!preview ? 'pointer-events-none' : ''}`} style={{ borderRadius: '12px', backgroundColor: 'white' }}>
                 <div className="p-6">
                     <div className={`flex items-center ${iconPos === 'right' ? 'flex-row-reverse' : ''}`}>
                        <div className={`${iconPos === 'right' ? 'ml-6' : 'mr-6'} ${icTextColor}`}>
                          <i className={`fas ${block.content.icon}`} style={{ fontSize: iconFontSz }}></i>
                        </div>
                         <div className="flex-1">
                             <h5 className={`mt-0 text-xl font-bold mb-2 ${icTextColor}`}>{block.content.title}</h5>
                             <div className="text-gray-600 text-sm leading-relaxed moodle-content" dangerouslySetInnerHTML={{ __html: block.content.text || '' }} />
                         </div>
                     </div>
                 </div>
             </div>
         );
      }

      case BlockType.CONCLUSION: {
        const color = block.content.color || 'info';
        const style = block.content.style || 'border';
        let strongColor = '#07b3c1';
        let lightColor = '#cff4fc';
        switch (color) {
            case 'purple': strongColor = '#6f42c1'; lightColor = '#f3e5f5'; break;
            case 'orange': strongColor = '#fd7e14'; lightColor = '#ffe5d0'; break;
            case 'primary': strongColor = '#0d6efd'; lightColor = '#cfe2ff'; break;
            case 'success': strongColor = '#198754'; lightColor = '#d1e7dd'; break;
            case 'danger':  strongColor = '#dc3545'; lightColor = '#f8d7da'; break;
            case 'yellow': strongColor = '#d4a000'; lightColor = '#fff8e6'; break;
            case 'secondary': strongColor = '#6c757d'; lightColor = '#e2e3e5'; break;
            case 'light': strongColor = '#adb5bd'; lightColor = '#f8f9fa'; break;
        }
        let containerStyle: React.CSSProperties = { borderWidth: '1px', borderStyle: 'solid', borderColor: strongColor };
        let titleColor = strongColor;
        if (style === 'filled') {
            containerStyle.backgroundColor = strongColor;
            containerStyle.color = (color === 'yellow' || color === 'light') ? '#212529' : 'white';
            titleColor = (color === 'yellow' || color === 'light') ? '#212529' : 'white';
        } else if (style === 'filled_light') {
            containerStyle.backgroundColor = lightColor;
            containerStyle.color = '#212529';
            titleColor = strongColor;
        } else {
            containerStyle.backgroundColor = 'white';
            containerStyle.color = '#212529';
            titleColor = strongColor;
        }
        const hasAreaContent = block.areas?.content !== undefined;
        const showNestedConclusion = hasAreaContent && (!preview || block.areas!.content.length > 0);
        return (
          <div className="p-4 rounded mb-3" style={containerStyle}>
            {block.content.showTitle !== false && (() => { const TitleTag = (block.content.titleSize || 'h5') as any; return <TitleTag className="font-bold mb-2" style={{ color: titleColor }}>{block.content.title || 'Contenedor'}</TitleTag>; })()}
              {showNestedConclusion ? (
                <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Contenido del contenedor" />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: block.content.text || '' }} className="moodle-content" />
              )}
          </div>
        );
      }
         
      case BlockType.PODCAST: {
         const pLabel = block.content.customLabel || 'Pódcast';
         const pColor = block.content.color || 'info';
         let pTextClass = 'text-[#07b3c1]';
         let pBorderClass = 'border-blue-100';
         if(pColor === 'primary') { pTextClass = 'text-blue-600'; pBorderClass = 'border-blue-200'; }
         else if(pColor === 'purple') { pTextClass = 'text-[#5a31b5]'; pBorderClass = 'border-[#5a31b5]/30'; }
         else if(pColor === 'orange') { pTextClass = 'text-[#e0421f]'; pBorderClass = 'border-[#e0421f]/30'; }
         else if(pColor === 'success') { pTextClass = 'text-green-600'; pBorderClass = 'border-green-200'; }
         else if(pColor === 'danger') { pTextClass = 'text-red-600'; pBorderClass = 'border-red-200'; }
         else if(pColor === 'warning') { pTextClass = 'text-yellow-600'; pBorderClass = 'border-yellow-200'; }
         return (<div className={`${block.content.showBorder !== false ? `border ${pBorderClass}` : ''} rounded bg-white p-4 flex gap-4 items-center`}>
            <div className={pTextClass}><i className={`fas ${block.content.icon || 'fa-headphones'}`} style={{ fontSize: 60 }} /></div>
            <div className="flex-1">
                <p className={`${pTextClass} font-bold mb-2`}>{pLabel}{block.content.number ? ` ${block.content.number}` : ''}: {block.content.title}</p>
                <div className="w-full bg-gray-100 rounded-full h-8 flex items-center px-2 text-gray-500 text-xs">
                    <Play size={12} className="mr-2"/> Audio Player Simulation
                </div>
            </div>
         </div>);
      }

      case BlockType.TABS: {
        const tabBg = ({'none':'#013549','blue':'#2563eb','dark':'#013549','primary':'#2563eb','info':'#07b3c1','purple':'#5a31b5','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d'} as Record<string,string>)[block.content.color||'none']||'#013549';
        const isHorizontal = block.content.orientation === 'horizontal';
        
        if (!preview) {
          return (
            <div className="bg-white border border-gray-200 rounded overflow-visible">
              
              {/* ── Vista previa de la orientación de las tabs ── */}
              {isHorizontal ? (
                <div className="flex items-end gap-0 px-3 pt-3 bg-gray-50 border-b-2 border-gray-200 overflow-x-auto">
                  {block.content.items?.map((item: any, i: number) => (
                    <div key={i} className="px-4 py-2 text-white text-xs font-bold rounded-t-lg mr-1 whitespace-nowrap border-b-2" style={{ backgroundColor: tabBg, borderColor: tabBg }}>
                      {item.title}
                    </div>
                  ))}
                  <div className="flex-1 border-b-2 border-transparent pb-2 pl-2">
                    <span className="text-[10px] text-gray-400 italic">tabs horizontales</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-0 bg-gray-50 border-b border-gray-200 px-3 py-2 items-center">
                  <div className="flex flex-col gap-1 mr-3 border-r border-gray-200 pr-3">
                    {block.content.items?.map((item: any, i: number) => (
                      <div key={i} className="px-2 py-1 text-white text-[11px] font-bold rounded flex items-center justify-between gap-2 min-w-[80px]" style={{ backgroundColor: tabBg }}>
                        <span className="truncate">{item.title}</span>
                        <span className="text-white/50 text-[10px]">›</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 italic">tabs verticales</span>
                </div>
              )}

              <div className="px-3 py-1 bg-amber-50 border-b border-amber-100">
                <span className="text-[10px] text-amber-600">Modo edición — todas las pestañas expandidas para arrastrar contenido</span>
              </div>

              <div className="p-2 space-y-2">
                {block.content.items?.map((item: any, i: number) => {
                  const itemAreaId = item.id || `item-${i}`;
                  const areaBlocks = block.areas?.[itemAreaId];
                  return (
                    <div key={i} className="border border-gray-200 rounded overflow-visible">
                      <div className="text-white px-3 py-1.5 text-xs font-bold flex items-center gap-2" style={{ backgroundColor: tabBg }}>
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] shrink-0">{i + 1}</span>
                        {item.title}
                        <span className="ml-auto text-[9px] opacity-40">{isHorizontal ? '⬜ horiz.' : '▣ vert.'}</span>
                      </div>
                      <div className="p-2">
                        {areaBlocks !== undefined ? (
                          <NestedArea {...nestedAreaProps} blocks={areaBlocks} parentId={block.id} areaId={itemAreaId} label={`Pestaña: ${item.title}`} />
                        ) : (
                          <div className="moodle-content pointer-events-none" dangerouslySetInnerHTML={{ __html: item.content || '' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!block.content.items || block.content.items.length === 0) && (
                  <div className="p-4 text-center text-gray-400 italic text-sm">Sin pestañas — agrega desde el panel derecho</div>
                )}
              </div>
            </div>
          );
        }

        const safeActiveTab = Math.min(activeTab, Math.max(0, (block.content.items?.length ?? 1) - 1));
        return (
          <div className={`bg-white border border-gray-200 rounded p-4 ${isHorizontal ? 'flex flex-col' : 'flex gap-4'}`}>
                        <div className={`${isHorizontal ? 'w-full flex border-b border-gray-100 mb-4' : 'w-1/4 space-y-2'}`}>
              {block.content.items?.map((item: any, i: number) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveTab(i); }}
                  className={`text-left px-3 py-2 rounded-t transition-all text-sm flex justify-between items-center
                    ${isHorizontal ? 'border-b-2 mr-2' : 'w-full border mb-1'}
                    ${safeActiveTab === i
                      ? (isHorizontal ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/30' : 'text-white')
                      : (isHorizontal ? 'border-transparent text-gray-500 hover:text-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200')}`}
                  style={!isHorizontal && safeActiveTab === i ? { backgroundColor: tabBg, borderColor: tabBg } : undefined}
                >
                  {item.title}
                  {!isHorizontal && safeActiveTab !== i && <span className="text-gray-400">›</span>}
                </button>
              ))}
            </div>
            <div className={`${isHorizontal ? 'w-full' : 'w-3/4 p-4 border-l border-gray-100'}`}>
              {block.content.items?.[safeActiveTab] ? (() => {
                const item = block.content.items[safeActiveTab];
                const itemAreaId = item.id || `item-${safeActiveTab}`;
                const areaBlocks = block.areas?.[itemAreaId];
                return areaBlocks !== undefined && areaBlocks.length > 0 ? (
                  areaBlocks.map((b, bi) => (
                    <BlockRenderer key={b.id} block={b} index={bi} parentId={block.id} columnId={itemAreaId}
                      selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate}
                      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
                      dropTarget={dropTarget} darkMode={darkMode} preview={preview} isNested={true}
                      onInsertBlock={onInsertBlock}
                    />
                  ))
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: item.content || '' }} className="text-gray-800 moodle-content" />
                );
              })() : (
                <p className="text-gray-400 italic">No hay contenido en esta pestaña</p>
              )}
            </div>
          </div>
        );
      }

case BlockType.CITATION: {
  const isIconRight = block.content.iconPosition === 'right';
  const layout = block.content.layout || 'horizontal';
  const hasAreaContent = block.areas?.content !== undefined;
  const showNestedCitation = hasAreaContent && (!preview || block.areas!.content.length > 0);

  const iconPxMap: Record<string, number> = { sm: 60, md: 90, lg: 130, xl: 180 };
  const iconPx = iconPxMap[block.content.iconSize || 'md'];

  const TitleTag = (block.content.titleSize || 'h5') as any;
  const titleColorClass = block.content.titleColor || 'text-info';
  const titleSizeMap: Record<string, string> = { h3: 'text-2xl', h4: 'text-xl', h5: 'text-lg', h6: 'text-base' };
  const titleSizeClass = titleSizeMap[block.content.titleSize || 'h5'];

  const bgStyleMap: Record<string, React.CSSProperties> = {
    none:    { backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' },
    white:   { backgroundColor: '#ffffff', border: '1px solid #dee2e6' },
    primary: { backgroundColor: '#cfe2ff', border: '1px solid #b6d4fe' },
    info:    { backgroundColor: '#cff4fc', border: '1px solid #9eeaf9' },
    success: { backgroundColor: '#d1e7dd', border: '1px solid #a3cfbb' },
    warning: { backgroundColor: '#fff3cd', border: '1px solid #ffe69c' },
    danger:  { backgroundColor: '#f8d7da', border: '1px solid #f1aeb5' },
    purple:  { backgroundColor: '#e9e0f8', border: '1px solid #c9b8ef' },
    orange:  { backgroundColor: '#ffe5d0', border: '1px solid #ffcba4' },
    dark:    { backgroundColor: '#343a40', border: '1px solid #495057' },
  };
  const bgStyle = bgStyleMap[block.content.bgColor || 'none'];

  // ✅ Alineación dinámica: usa el valor guardado, o el default según layout
  const textAlign = block.content.textAlign || (layout === 'vertical' ? 'center' : 'left');

  const textContent = showNestedCitation ? (
    <div style={{ textAlign: textAlign as any }}>
      <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Contenido del texto" />
    </div>
  ) : (
    <div
      className="text-gray-700 leading-relaxed moodle-content"
      style={{ textAlign: textAlign as any }}
      dangerouslySetInnerHTML={{ __html: block.content.text || block.content.intro || '' }}
    />
  );

  const iconEl = (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...(layout === 'vertical'
        ? { width: '100%', marginBottom: '16px', marginLeft: 0, marginRight: 0 }
        : { marginRight: isIconRight ? '0' : '16px', marginLeft: isIconRight ? '16px' : '0' }
      )
    }}>
      <div style={{
        width: iconPx, height: iconPx,
        backgroundColor: 'transparent',
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <img
          src={block.content.iconUrl || 'https://placehold.co/150'}
          alt="Icon"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );

  const textEl = (
    <div style={{ 
      flex: layout === 'vertical' ? 'unset' : 1,
      width: layout === 'vertical' ? '100%' : 'auto',
      textAlign: textAlign as any   // ✅ dinámico
    }}>
      {block.content.title && (
        <TitleTag className={`font-bold mb-3 ${titleColorClass} ${titleSizeClass}`}>
          {block.content.title}
        </TitleTag>
      )}
      {textContent}
    </div>
  );

  const containerStyle: React.CSSProperties = layout === 'vertical'
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: textAlign as any }
    : { display: 'flex', flexDirection: isIconRight ? 'row-reverse' : 'row', alignItems: 'center', gap: '16px', width: '100%' };

  return (
    <div style={{ ...bgStyle, padding: '24px', borderRadius: '12px', overflow: 'visible' }}>
            <div style={containerStyle}>
        {iconEl}
        {textEl}
      </div>
    </div>
  );
}

      case BlockType.TASK: {
          const isGroup = block.content.groupMode === 'group';
          const showTaskBadge = block.content.groupMode !== 'none';
          return (
            <div className="space-y-4 overflow-visible">
              {showTaskBadge && (
                <div className={`p-4 rounded border flex items-center ${isGroup ? 'bg-[#d4edda] text-[#155724] border-[#c3e6cb]' : 'bg-[#fff3cd] text-[#856404] border-[#ffeeba]'}`}>
                  {isGroup ? <Users className="mr-3" size={24}/> : <User className="mr-3" size={24}/>}
                  <div><strong>¡Atención!</strong> Esta actividad debe entregarse {isGroup ? 'en grupo' : 'de manera individual'}.</div>
                </div>
              )}
              <div className="border border-gray-300 rounded shadow-sm overflow-visible mb-4">
                <div className="text-white p-3 flex items-center" style={{ backgroundColor: ({'info':'#07b3c1','primary':'#2563eb','purple':'#5a31b5','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d','dark':'#023649'} as Record<string,string>)[block.content.itineraryColor||'info']||'#07b3c1' }}>
                  <Map size={20} className="mr-2"/><h5 className="mb-0 text-lg font-medium">{block.content.itineraryTitle || 'Itinerario o Ruta de Desarrollo'}</h5>
                </div>
                <div className="p-4 bg-white text-gray-800">
                  {block.areas?.itinerary !== undefined && (!preview || block.areas.itinerary.length > 0) ? (
                    <NestedArea {...nestedAreaProps} blocks={block.areas.itinerary} parentId={block.id} areaId="itinerary" label="Itinerario" />
                  ) : (
                    <div className="moodle-content" dangerouslySetInnerHTML={{__html: block.content.itinerary || ''}} />
                  )}
                </div>
              </div>
              <div className="border border-gray-300 rounded shadow-sm overflow-visible">
                <div className="text-white p-3 flex items-center" style={{ backgroundColor: ({'info':'#07b3c1','primary':'#2563eb','purple':'#5a31b5','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d','dark':'#023649'} as Record<string,string>)[block.content.evaluationColor||'primary']||'#2563eb' }}>
                  <CheckCheck size={20} className="mr-2"/><h5 className="mb-0 text-lg font-medium">{block.content.evaluationTitle || 'Técnica / Instrumento de Evaluación'}</h5>
                </div>
                <div className="p-4 bg-white text-gray-800">
                  {block.areas?.evaluation !== undefined && (!preview || block.areas.evaluation.length > 0) ? (
                    <NestedArea {...nestedAreaProps} blocks={block.areas.evaluation} parentId={block.id} areaId="evaluation" label="Evaluación" />
                  ) : (
                    <div className="moodle-content" dangerouslySetInnerHTML={{__html: block.content.evaluation || ''}} />
                  )}
                </div>
              </div>
            </div>
          );
      }

      case BlockType.FORUM: {
        const hasAreaContent = block.areas?.content !== undefined;
        const showNestedForum = hasAreaContent && (!preview || block.areas!.content.length > 0);
        const forumIsGroup = block.content.groupMode === 'group';
        const showForumBadge = block.content.groupMode === 'individual' || block.content.groupMode === 'group';
        return (<div className="space-y-2 overflow-visible">
          {showForumBadge && (
            <div className={`p-3 rounded border flex items-center text-sm ${forumIsGroup ? 'bg-[#d4edda] text-[#155724] border-[#c3e6cb]' : 'bg-[#fff3cd] text-[#856404] border-[#ffeeba]'}`}>
              {forumIsGroup ? <Users className="mr-2" size={18}/> : <User className="mr-2" size={18}/>}
              <div><strong>¡Atención!</strong> Esta actividad debe entregarse {forumIsGroup ? 'en grupo' : 'de manera individual'}.</div>
            </div>
          )}
          <div className={`card mb-4 overflow-visible ${block.content.showBorder !== false ? 'border rounded border-gray-200 shadow-sm' : ''}`}>
            <div className="text-white p-3 flex items-center" style={{ backgroundColor: ({'primary':'#2563eb','info':'#07b3c1','purple':'#5a31b5','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d','dark':'#023649'} as Record<string,string>)[block.content.color||'primary']||'#2563eb' }}><MessageSquare className="mr-2" size={20} />{block.content.title}</div>
            <div className="p-4 bg-white text-gray-800">
              {showNestedForum ? (
                <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Instrucciones del foro" />
              ) : (
                <div className="moodle-content" dangerouslySetInnerHTML={{__html: block.content.text || ''}} />
              )}
            </div>
          </div>
        </div>);
      }

      case BlockType.QUESTIONNAIRE: {
        const hasAreaContent = block.areas?.content !== undefined;
        const showNestedQ = hasAreaContent && (!preview || block.areas!.content.length > 0);
        return (<div className={`card mb-4 overflow-visible ${block.content.showBorder !== false ? 'border rounded border-gray-200 shadow-sm' : ''}`}>
                        <div className="text-white p-3 flex items-center" style={{ backgroundColor: ({'purple':'#5a31b5','primary':'#2563eb','info':'#07b3c1','orange':'#e0421f','success':'#16a34a','danger':'#dc2626','secondary':'#6c757d','dark':'#023649'} as Record<string,string>)[block.content.color||'purple']||'#5a31b5' }}><CheckSquare className="mr-2" size={20}/>
              <h5 className="mb-0 font-bold">{block.content.title}</h5>
            </div>
            <div className="p-4 bg-white text-gray-800">
              {showNestedQ ? (
                <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Instrucciones del cuestionario" />
              ) : (
                <div className="moodle-content" dangerouslySetInnerHTML={{__html: block.content.text || ''}} />
              )}
            </div>
        </div>);
      }

      case BlockType.MODAL: {
        const mVariant = block.content.variant || 'primary';
        const mTrig = block.content.triggerType || 'button';
        const mSize = block.content.size || 'md';
        const mFilled: Record<string, string> = { primary: 'bg-blue-600 text-white', info: 'bg-cyan-500 text-white', warning: 'bg-[#5a31b5] text-white', success: 'bg-green-600 text-white', secondary: 'bg-gray-500 text-white', danger: 'bg-[#1e2a6b] text-[#ffe44e]', orange: 'bg-[#e45d3d] text-white', dark: 'bg-gray-800 text-white', light: 'bg-[#ffe44e] text-[#3a3aaa]' };
        const mTextColor: Record<string, string> = { primary: 'text-blue-600', info: 'text-cyan-600', warning: 'text-[#5a31b5]', success: 'text-green-600', secondary: 'text-gray-500', danger: 'text-[#1e2a6b]', orange: 'text-[#e45d3d]', dark: 'text-gray-800', light: 'text-[#3a3aaa]' };
        const mOutlined: Record<string, string> = { primary: 'border-blue-600 text-blue-600', info: 'border-cyan-500 text-cyan-600', warning: 'border-[#5a31b5] text-[#5a31b5]', success: 'border-green-600 text-green-600', secondary: 'border-gray-500 text-gray-500', danger: 'border-[#1e2a6b] text-[#1e2a6b]', orange: 'border-[#e45d3d] text-[#e45d3d]', dark: 'border-gray-800 text-gray-800', light: 'border-[#ffe44e] text-[#3a3aaa]' };
        const fill = mFilled[mVariant] || mFilled.primary;
        const txt = mTextColor[mVariant] || mTextColor.primary;
        const outline = mOutlined[mVariant] || mOutlined.primary;
        const trigLabel = block.content.triggerText || 'Abrir';
        const isFull = mTrig === 'button' && block.content.isFullWidth === true;
        const alignCls = block.content.align === 'left' ? 'text-left' : block.content.align === 'right' ? 'text-right' : 'text-center';

        let trigEl: React.ReactNode;
        if (mTrig === 'button') trigEl = <button className={`px-4 py-2 rounded font-bold text-sm ${isFull ? 'w-full block' : ''} ${block.content.isSolid === false ? `bg-transparent border-2 ${outline}` : fill} ${!preview ? 'pointer-events-none' : ''}`}>{trigLabel}</button>;
        else if (mTrig === 'badge') trigEl = <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${fill} ${!preview ? 'pointer-events-none' : ''}`}>{trigLabel}</span>;
        else trigEl = <span className={`underline font-bold ${txt} ${!preview ? 'pointer-events-none' : ''}`}>{trigLabel}</span>;

        if (preview) return <div className={alignCls}>{trigEl}</div>;

        const sizeMap: Record<string, { w: string; label: string }> = { sm: { w: '320px', label: 'SM' }, md: { w: '460px', label: 'MD' }, lg: { w: '640px', label: 'LG' }, xl: { w: '820px', label: 'XL' }, fullscreen: { w: '100%', label: 'Pantalla completa' } };
        const sz = sizeMap[mSize] || sizeMap.md;
        const chips: string[] = [sz.label];
        if (block.content.centered) chips.push('Centrado');
        if (block.content.scrollable) chips.push('Scroll');
        if (block.content.animation === false) chips.push('Sin animación');
        if (block.content.staticBackdrop) chips.push('Fondo fijo');

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[11px] font-bold shrink-0">1</span>
              <span className="text-[10px] uppercase tracking-wide font-bold text-gray-400">Disparador</span>
            </div>
            <div className={`pl-7 ${alignCls}`}>{trigEl}</div>

            <div className="flex items-center gap-2 pl-7 text-gray-400">
              <ArrowDown size={14} />
              <span className="text-[11px] italic">al hacer clic abre la ventana</span>
            </div>

            <div className="flex items-center flex-wrap gap-2 pt-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[11px] font-bold shrink-0">2</span>
              <span className="text-[10px] uppercase tracking-wide font-bold text-gray-400">Ventana emergente</span>
              {chips.map((c) => (
                <span key={c} className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{c}</span>
              ))}
            </div>

            <div className="pl-7">
              <div className="relative">
                <div className="absolute -inset-x-2 -inset-y-2 rounded-lg bg-slate-900/5" />
                <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden mx-auto" style={{ maxWidth: sz.w }}>
                  <div className={`flex items-center justify-between px-4 py-2.5 ${fill}`}>
                    <span className="font-bold text-sm truncate">{block.content.title || 'Título de la Modal'}</span>
                    <X size={16} className="shrink-0 opacity-80" />
                  </div>
                  <div className="p-3">
                    <NestedArea {...nestedAreaProps} blocks={block.areas?.modal || []} parentId={block.id} areaId="modal" label="Contenido de la ventana" />
                  </div>
                  {block.content.showFooter !== false && (
                    <div className="flex justify-end px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                      <span className="px-3 py-1 rounded bg-gray-200 text-gray-500 text-xs font-bold">Cerrar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case BlockType.POPOVER: {
         const popoverVariant = block.content.variant || 'info';
         const popoverBtnStyles: Record<string, string> = { primary: 'bg-blue-600 text-white hover:bg-blue-700', info: 'bg-cyan-500 text-white hover:bg-cyan-600', warning: 'bg-[#5a31b5] text-white hover:bg-[#4a2696]', success: 'bg-green-600 text-white hover:bg-green-700', secondary: 'bg-gray-500 text-white hover:bg-gray-600', danger: 'bg-red-600 text-white hover:bg-red-700', orange: 'bg-[#e45d3d] text-white hover:bg-[#c94e31]' };
         const popoverStyleClass = popoverBtnStyles[popoverVariant] || popoverBtnStyles.info;
         return (
            <div className={`border border-gray-200 p-4 rounded bg-gray-50 flex flex-col items-center gap-2 ${preview ? 'border-none bg-transparent p-0' : ''}`}>
               <div className="relative group">
                  <button className={`px-4 py-2 rounded text-sm font-bold transition-colors ${popoverStyleClass} ${!preview ? 'pointer-events-none' : ''}`}>{block.content.triggerText}</button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs p-2 rounded text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-[60]">
                     {block.content.text}
                     <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                  </div>
               </div>
               {!preview && <div className="text-xs text-gray-400 mt-2 italic">Pasa el mouse para ver popover</div>}
            </div>
         );
      }

case BlockType.TIMELINE: {
  const tlColor = block.content.color || 'primary';
  const tlHex: Record<string,string> = { primary:'#2563eb', info:'#07b3c1', success:'#16a34a', danger:'#dc2626', warning:'#d97706', yellow:'#d4a000', purple:'#5a31b5', orange:'#e0421f', secondary:'#6c757d' };
  const hex = tlHex[tlColor] || tlHex.primary;
  return (
    <div className={`py-2 ${!preview ? 'pointer-events-none' : ''}`}>
            <div style={{ borderLeft: `3px solid ${hex}`, paddingLeft: '20px', marginLeft: '10px' }}>
        {block.content.items?.map((item: any, i: number) => (
          <div key={i} className="mb-4" style={{ position: 'relative' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: hex, position: 'absolute', left: '-27px', top: '4px', border: '2px solid white', boxShadow: `0 0 0 2px ${hex}` }}/>
            {item.date && <span className="text-xs font-bold mb-1 block" style={{ color: hex }}>{item.date}</span>}
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', maxHeight: `${block.content.itemImageHeight || 160}px`, objectFit: 'cover' }}/>
              )}
              <div className="p-3">
                <p className="font-bold text-gray-800 mb-1 text-sm">{item.title}</p>
                <p className="text-gray-600 text-xs leading-relaxed mb-0">{item.text || <em style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Escribe aquí...</em>}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

      case BlockType.STAT_CARD: {
        const items = block.content.items || [];
        const colClass = items.length === 2 ? 'w-1/2' : items.length >= 3 ? 'w-1/3' : 'w-full';
        return (
          <div className={`flex flex-wrap gap-0 ${!preview ? 'pointer-events-none' : ''}`}>
                        {items.map((item: any, i: number) => {
              const colorMap: Record<string,string> = { primary:'#2563eb', info:'#07b3c1', success:'#16a34a', danger:'#dc2626', warning:'#d97706', purple:'#5a31b5', orange:'#e0421f', secondary:'#6c757d' };
              const c = colorMap[item.color || 'info'] || colorMap.info;
              return (
                <div key={i} className={`${colClass} p-2`} style={{ minWidth: '120px' }}>
                  <div className={`bg-white p-4 text-center h-full ${block.content.showBorder !== false ? 'border rounded-xl shadow-sm' : 'rounded-xl'}`}>
                    <i className={`fas ${item.icon || 'fa-chart-bar'} fa-2x mb-2`} style={{ color: c }}></i>
                    <div className="font-black text-3xl mb-1" style={{ color: c }}>{item.number}</div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{item.label || <em style={{ color: '#CBD5E1', fontStyle: 'italic', textTransform: 'none' }}>Escribe aquí...</em>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }


case BlockType.CODE_BLOCK: {
  const lang = block.content.language || 'html';
  const code = block.content.code || '';
  const filename = block.content.filename || '';
  const showLines = block.content.showLineNumbers !== false;
  const isDark = (block.content.theme || 'dark') !== 'light';
  const headerBg = isDark ? '#1e1e1e' : '#e8e8e8';
  const codeBg = isDark ? '#1e1e1e' : '#f5f5f5';
  const lineNumBg = isDark ? '#161616' : '#e0e0e0';
  const lineNumColor = isDark ? '#6e7681' : '#888888';
  const lineNumBorder = isDark ? '#2d2d2d' : '#cccccc';
  const codeColor = isDark ? '#d4d4d4' : '#1e1e1e';
  const filenameColorCode = isDark ? '#aaaaaa' : '#555555';

  const langColors: Record<string, string> = {
    html: '#e34c26', css: '#264de4', javascript: '#f7df1e', js: '#f7df1e',
    php: '#777bb4', python: '#3572A5', sql: '#e38c00', bash: '#89e051', json: '#292929',
  };
  const langColor = langColors[lang.toLowerCase()] || '#6c757d';
  const langLabel = lang.toUpperCase();
 
  const lines = code.split('\n');
 
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${!preview ? 'pointer-events-none' : ''}`}>
            {/* Header de la ventana editor */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: headerBg }}>
        <div className="flex items-center gap-2">
          {isDark && <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }}/>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }}/>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }}/>
          </div>}
          {filename && <span className="text-xs ml-2" style={{ color: filenameColorCode }}>{filename}</span>}
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: langColor, color: lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'js' ? '#000' : '#fff', fontSize: '10px' }}>{langLabel}</span>
      </div>
      <div className="overflow-x-auto" style={{ backgroundColor: codeBg }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'monospace', fontSize: '13px' }}>
          <tbody>
            {lines.map((line: string, i: number) => (
              <tr key={i} style={{ lineHeight: '1.5' }}>
                {showLines && (
                  <td style={{ padding: '0 12px', color: lineNumColor, textAlign: 'right', userSelect: 'none', minWidth: '40px', borderRight: `1px solid ${lineNumBorder}`, backgroundColor: lineNumBg }}>
                    {i + 1}
                  </td>
                )}
                <td style={{ padding: '0 16px', color: codeColor, whiteSpace: 'pre' }}>
                  {line || '\u00a0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

case BlockType.COLLAPSE_ICON: {
  const colId = `col_${block.id.split('-')[0]}`;
  const iconPxMap: Record<string, number> = { sm: 60, md: 90, lg: 130, xl: 180 };
  const iconPx = iconPxMap[block.content.iconSize || 'md'];
  const titleColorMap: Record<string, string> = { 'text-info': '#07b3c1', 'text-primary': '#0d6efd', 'text-orange': '#e0421f', 'text-success': '#16a34a', 'text-danger': '#dc2626', 'text-purple': '#5a31b5', 'text-dark': '#212529' };
  const titleHex = titleColorMap[block.content.titleColor || 'text-info'] || '#07b3c1';
  const triggerColorMap: Record<string, string> = { orange: '#e0421f', info: '#07b3c1', primary: '#0d6efd', success: '#16a34a', danger: '#dc2626', purple: '#5a31b5' };
  const triggerHex = triggerColorMap[block.content.triggerColor || 'orange'] || '#e0421f';
  const bgMap: Record<string, string> = { white: '#ffffff', none: '#f8f9fa', info: '#eaf8fa', yellow: '#fff8e6', purple: '#f0ebfa', orange: '#ffeae6' };
  const bgColor = bgMap[block.content.bgColor || 'white'] || '#ffffff';
 
  const colIconPos = block.content.iconPosition || 'left';
  return (
    <div style={{ backgroundColor: bgColor, border: block.content.showBorder !== false ? '1px solid #dee2e6' : 'none', borderRadius: '8px', padding: '16px', overflow: 'visible' }}>
            <div style={{ display: 'flex', flexDirection: colIconPos === 'right' ? 'row-reverse' : 'row', alignItems: 'center' }}>
        <div style={{ flexShrink: 0, [colIconPos === 'right' ? 'marginLeft' : 'marginRight']: '16px', cursor: preview ? 'pointer' : 'default' }}
          onClick={() => preview && setCollapseOpen(!collapseOpen)}>
          <div style={{ width: iconPx, height: iconPx, backgroundColor: 'transparent', borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={block.content.iconUrl || 'https://placehold.co/150'} alt="icon" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: preview ? 'pointer' : 'default' }}
            onClick={() => preview && setCollapseOpen(!collapseOpen)}>
            <span className="font-bold" style={{ color: triggerHex, fontSize: '1rem' }}>
              {block.content.triggerText || 'Clic para ver el contenido'}
            </span>
            <span style={{ color: triggerHex, fontSize: '0.8rem', transition: 'transform 0.3s', transform: (!preview || !collapseOpen) ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
          </div>
          {(!preview || !collapseOpen) && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dee2e6' }}>
              {block.content.contentTitle && (
                <p className="font-bold mb-2" style={{ color: titleHex }}>{block.content.contentTitle}</p>
              )}
              <div className="moodle-content" dangerouslySetInnerHTML={{ __html: block.content.contentText || '' }}/>
            </div>
          )}
          {!preview && (
            <div className="mt-1">
              <span className="text-xs text-gray-400 italic">En Moodle el collapse funciona con Bootstrap JS nativo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

case BlockType.CARD_IMAGE: {
  const titleColorMap: Record<string, string> = {
    'text-primary': '#0d6efd', 'text-info': '#07b3c1', 'text-success': '#16a34a',
    'text-danger': '#dc2626', 'text-purple': '#5a31b5', 'text-orange': '#e0421f', 'text-dark': '#212529'
  };
  const titleHex = titleColorMap[block.content.titleColor || 'text-primary'] || '#0d6efd';
  const maxW = block.content.fullWidth ? '100%' : '28rem';
 
  return (
    <div className={`bg-white overflow-hidden ${block.content.showBorder !== false ? 'border rounded-xl shadow-sm' : ''}`}
      style={{ maxWidth: maxW, width: '100%' }}>
            {block.content.imageUrl && (
        <img
          src={block.content.imageUrl}
          alt={block.content.title || ''}
          className="w-full"
          style={{ maxHeight: `${block.content.imageHeight || 220}px`, objectFit: 'cover' }}
        />
      )}
      <div className="p-4">
        {block.content.title && (
          <h5 className="font-bold mb-3" style={{ color: titleHex, fontSize: '1rem' }}>
            {block.content.title}
          </h5>
        )}
        <NestedArea {...nestedAreaProps} blocks={block.areas?.content || []} parentId={block.id} areaId="content" label="Contenido" />
      </div>
    </div>
  );
}

case BlockType.SECTION_BANNER: {
  const sbColor = block.content.color || 'primary';
  const sbStyle = block.content.style || 'solid';
  const sbColorMap: Record<string,string> = {
    primary:'#0d6efd', info:'#07b3c1', success:'#198754', danger:'#dc3545',
    warning:'#ffc107', yellow:'#d4a000', purple:'#6f42c1', orange:'#fd7e14', secondary:'#6c757d'
  };
  const sbLightMap: Record<string,string> = {
    primary:'#cfe2ff', info:'#cff4fc', success:'#d1e7dd', danger:'#f8d7da',
    warning:'#fff3cd', yellow:'#fff8e6', purple:'#e9e0f8', orange:'#ffe5d0', secondary:'#e2e3e5'
  };
  const sbHex = sbColorMap[sbColor] || sbColorMap.primary;
  const sbLight = sbLightMap[sbColor] || sbLightMap.primary;
  const iconSize = block.content.iconSize || 'md';
  const iconBoxSizeMap: Record<string,number> = { sm: 36, md: 44, lg: 58 };
  const iconFontSizeMap: Record<string,string> = { sm: '1.1rem', md: '1.6rem', lg: '2.2rem' };
  const iconBoxPx = iconBoxSizeMap[iconSize];
  const iconFontSize = iconFontSizeMap[iconSize];
 
  let containerStyle: React.CSSProperties = { marginBottom: '16px' };
  let titleColor = sbHex;
  let subtitleColor = '#6c757d';
  let iconColor = sbHex;
  let iconBg = `${sbHex}22`;
 
  if (sbStyle === 'solid') {
    containerStyle = { ...containerStyle, backgroundColor: sbHex, borderRadius: '12px', padding: '20px 28px' };
    titleColor = 'white'; subtitleColor = 'rgba(255,255,255,0.85)'; iconColor = 'white'; iconBg = 'rgba(255,255,255,0.2)';
  } else if (sbStyle === 'light') {
    containerStyle = { ...containerStyle, backgroundColor: sbLight, borderLeft: `6px solid ${sbHex}`, borderRadius: '0 8px 8px 0', padding: '18px 24px' };
  } else if (sbStyle === 'outline') {
    containerStyle = { ...containerStyle, border: `2px solid ${sbHex}`, borderRadius: '12px', padding: '18px 24px', backgroundColor: 'white' };
  } else if (sbStyle === 'gradient') {
    containerStyle = { ...containerStyle, background: `linear-gradient(135deg, ${sbHex}18 0%, ${sbLight} 100%)`, borderRadius: '12px', padding: '20px 28px', borderLeft: `4px solid ${sbHex}` };
  }
 
  return (
    <div style={containerStyle} className={!preview ? 'pointer-events-none' : ''}>
            <div className="flex items-center gap-3">
        {block.content.icon && (
          <div style={{
            width: `${iconBoxPx}px`, height: `${iconBoxPx}px`,
            backgroundColor: iconBg, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <i className={`fas ${block.content.icon}`} style={{ color: iconColor, fontSize: iconFontSize }} />
          </div>
        )}
        <div>
          <h3 style={{ color: titleColor, fontWeight: 800, fontSize: '1.15rem', marginBottom: '2px' }}>
            {block.content.title}
          </h3>
          {block.content.subtitle && (
            <p style={{ color: subtitleColor, fontSize: '0.88rem', marginBottom: 0 }}>
              {block.content.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

 case BlockType.BLOCKQUOTE: {
  const bqColor = block.content.color || 'info';
  const bqStyle = block.content.bqStyle || 'border';
  const bqMap: Record<string,string> = {
    primary:'#0d6efd', info:'#07b3c1', success:'#198754', danger:'#dc3545',
    warning:'#ffc107', yellow:'#d4a000', purple:'#6f42c1', orange:'#fd7e14', secondary:'#6c757d'
  };
  const bqLightMap: Record<string,string> = {
    primary:'#cfe2ff', info:'#cff4fc', success:'#d1e7dd', danger:'#f8d7da',
    warning:'#fff3cd', yellow:'#fff8e6', purple:'#e9e0f8', orange:'#ffe5d0', secondary:'#e2e3e5'
  };
  const bqHex = bqMap[bqColor] || bqMap.info;
  const bqLight = bqLightMap[bqColor] || bqLightMap.info;
  const textSize = block.content.textSize || 'md';
  const textSizeMap: Record<string,string> = { sm: '0.9rem', md: '1.05rem', lg: '1.2rem' };
  const showIcon = block.content.showIcon !== false;
 
  const containerStyle: React.CSSProperties =
    bqStyle === 'border'
      ? { borderLeft: `5px solid ${bqHex}`, paddingLeft: '20px', paddingTop: '8px', paddingBottom: '8px', margin: '16px 0' }
      : bqStyle === 'filled'
      ? { backgroundColor: bqLight, borderLeft: `5px solid ${bqHex}`, borderRadius: '0 8px 8px 0', padding: '20px 24px', margin: '16px 0' }
      : { backgroundColor: bqLight, borderRadius: '8px', padding: '20px 24px', margin: '16px 0', border: `1px solid ${bqHex}44` };
 
  return (
    <div className={`${!preview ? 'pointer-events-none' : ''}`} style={containerStyle}>
            {showIcon && (
        <i className="fas fa-quote-left mb-2 d-block" style={{ color: bqHex, opacity: 0.4, fontSize: '1.4rem' }} />
      )}
      <p style={{ fontSize: textSizeMap[textSize], fontStyle: 'italic', color: '#2b303a', lineHeight: '1.7', marginBottom: '10px', fontWeight: 400 }}>
        {block.content.text ? `"${block.content.text}"` : <em style={{ color: '#CBD5E1', fontStyle: 'italic', fontSize: '0.875rem' }}>Escribe aquí...</em>}
      </p>
      {(block.content.author || block.content.source) && (
        <footer style={{ fontSize: '0.88rem', color: '#6c757d', marginTop: '8px' }}>
          {block.content.author && <strong style={{ color: '#343a40' }}>— {block.content.author}</strong>}
          {block.content.source && <span style={{ marginLeft: '6px' }}>({block.content.source})</span>}
        </footer>
      )}
    </div>
  );
}

      case BlockType.DOWNLOAD_CARD: {
        const typeIconMap: Record<string,string> = { pdf: 'fa-file-pdf', word: 'fa-file-word', excel: 'fa-file-excel', powerpoint: 'fa-file-powerpoint', image: 'fa-file-image', audio: 'fa-file-audio', video: 'fa-file-video', zip: 'fa-file-archive', default: 'fa-file' };
        const typeColorMap: Record<string,string> = { pdf: '#dc3545', word: '#0d6efd', excel: '#198754', powerpoint: '#fd7e14', image: '#6f42c1', audio: '#07b3c1', video: '#07b3c1', zip: '#6c757d', default: '#6c757d' };
        return (
          <div className={`space-y-2 ${!preview ? 'pointer-events-none' : ''}`}>
                        {block.content.items?.map((item: any, i: number) => {
              const iconClass = typeIconMap[item.type] || typeIconMap.default;
              const iconColor = typeColorMap[item.type] || typeColorMap.default;
              return (
                <div key={i} className={`flex items-center gap-3 bg-white rounded-xl p-3 hover:shadow-md transition-shadow ${block.content.showBorder !== false ? 'border border-gray-200 shadow-sm' : ''}`}>
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}15` }}>
                    <i className={`fas ${iconClass} fa-lg`} style={{ color: iconColor }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate mb-0">{item.name}</p>
                    {item.size && <span className="text-xs text-gray-400">{item.size}</span>}
                  </div>
                  <a href={item.url || '#'} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                    style={{ backgroundColor: iconColor }} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => !preview && e.preventDefault()}>
                    <i className="fas fa-download"/>
                    {block.content.showDownloadLabel && <span className="ml-1">Descargar</span>}
                  </a>
                </div>
              );
            })}
            {(!block.content.items || block.content.items.length === 0) && (
              <div className="text-center text-gray-300 py-4 text-xs italic">Sin archivos — agrega desde el panel derecho</div>
            )}
          </div>
        );
      }

      case BlockType.INTRO_CARD: {
        const bgLightMap: Record<string, string> = {
          info: '#cff4fc', primary: '#cfe2ff', success: '#d1e7dd', danger: '#f8d7da',
          warning: '#fff3cd', yellow: '#fff8e6', purple: '#e9e0f8', orange: '#ffe5d0', secondary: '#e2e3e5',
        };
        const bgColor = bgLightMap[block.content.bgColor || 'info'] || bgLightMap.info;
        const hasArea = block.areas?.content !== undefined;
        const imgWidth = block.content.imageWidth || 140;

        return (
          <div style={{ backgroundColor: bgColor, borderRadius: '8px', padding: '16px' }}
            className={`overflow-visible ${!preview ? 'border border-dashed border-gray-300' : ''}`}>
                        <div className={`flex gap-4 items-center ${block.content.imagePosition === 'right' ? 'flex-row-reverse' : ''}`}>
              {block.content.imageUrl && (
                <div className="shrink-0 flex items-center justify-center">
                  <img src={block.content.imageUrl} alt="" className="rounded"
                    style={{ width: `${imgWidth}px`, maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {hasArea && (!preview || block.areas!.content.length > 0) ? (
                  <NestedArea {...nestedAreaProps} blocks={block.areas!.content} parentId={block.id} areaId="content" label="Contenido" />
                ) : (
                  <div className="moodle-content text-gray-500 italic text-sm">Arrastra contenido aquí...</div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default: return <div>Unknown block type</div>;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (preview) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, index, block.id, parentId, columnId);
  };
  
  const wrapperClasses = !preview ? 'editor-spacing border-2 rounded-lg cursor-default' : '';

  return (
    <>
      {!preview && isDropTarget && (
        <div className="flex items-center gap-2 my-1.5 px-1">
          <div className="h-0.5 flex-1 bg-blue-500 rounded-full" />
          <div className="shrink-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">↓ soltar aquí</div>
          <div className="h-0.5 flex-1 bg-blue-500 rounded-full" />
        </div>
      )}
      <div
        ref={ref}
        draggable={!preview}
        onDragStart={handleDragStart}
        onDragOver={(e) => {
          if (preview) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const insertIdx = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
          onDragOver(e, insertIdx, parentId, columnId);
        }}
        onDrop={(e) => {
          if (preview) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const insertIdx = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
          onDrop(e, insertIdx, parentId, columnId);
        }}
        onClick={(e) => { if (!preview) { e.stopPropagation(); onSelect(block.id); } }}
        tabIndex={!preview ? 0 : undefined}
        role={!preview ? 'group' : undefined}
        aria-label={!preview ? `Bloque ${block.type.toLowerCase()}${isSelected ? ' (seleccionado)' : ''} — Enter para seleccionar` : undefined}
        onKeyDown={(e) => {
          // Antes el bloque solo se podía seleccionar con clic: imposible navegar/seleccionar
          // solo con teclado. El chequeo target===currentTarget evita disparar esto cuando
          // Enter/Espacio se presiona dentro de un hijo interactivo (botón, editor de texto).
          if (preview || e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect(block.id); }
        }}
        className={`group relative transition-all duration-200 ${wrapperClasses} ${isSelected && !preview ? 'block-selected z-10' : 'border-transparent'} ${!preview && !isSelected ? 'hover:border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]' : ''} ${block.type === BlockType.LAYOUT ? 'p-1' : ''} ${!preview ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]' : ''}`}
      >
        {/* Drag handle */}
        {!preview && (
          <div className={`absolute left-1/2 -translate-x-1/2 -top-3.5 flex items-center rounded-t-md px-2 py-0.5 z-20 cursor-grab active:cursor-grabbing ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            style={{ background: 'var(--color-sidebar)', boxShadow: 'var(--neu-dark-out)', color: 'var(--color-text-muted)' }}>
            <GripVertical size={14} />
          </div>
        )}

        {/* ── ACTION TOOLBAR ── */}
        {!preview && isSelected && (
          <div className="absolute right-2 -top-3 flex items-center gap-1 rounded-full px-2 py-1 z-20"
            style={{ background: 'var(--color-sidebar)', boxShadow: 'var(--neu-dark-out)' }}>

            {/* Tipo de bloque */}
            <span className="text-[9px] font-bold uppercase tracking-wide select-none pr-1.5 border-r mr-0.5"
              style={{ color: 'var(--color-text-label)', borderColor: 'rgba(165,180,252,0.2)' }}>
              {BLOCK_LABELS[block.type] || block.type}
            </span>

            {/* Mover arriba/abajo */}
            {onMoveUp && (
              <button onClick={(e) => { e.stopPropagation(); onMoveUp(block.id); }} disabled={isFirstBlock}
                className="p-0.5 disabled:opacity-20 rounded" title="Mover arriba" aria-label="Mover bloque arriba"
                style={{ color: 'var(--color-text-muted)' }}>
                <ArrowUp size={14}/>
              </button>
            )}
            {onMoveDown && (
              <button onClick={(e) => { e.stopPropagation(); onMoveDown(block.id); }} disabled={isLastBlock}
                className="p-0.5 disabled:opacity-20 rounded" title="Mover abajo" aria-label="Mover bloque abajo"
                style={{ color: 'var(--color-text-muted)' }}>
                <ArrowDown size={14}/>
              </button>
            )}
            {(onMoveUp || onMoveDown) && <div className="w-px h-3 mx-0.5" style={{ background: 'rgba(165,180,252,0.2)' }}/>}

            {/* Copiar al portapapeles interno */}
            <button
              onClick={(e) => { e.stopPropagation(); copyBlock(block); }}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              title="Copiar bloque (Ctrl+C no aplica, usa este botón)"
              aria-label="Copiar bloque"
            >
              <Clipboard size={14} />
            </button>

            {/* Pegar después de este bloque */}
            {hasCopied && clipboard && onInsertBlock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertBlock(cloneFromClipboard(clipboard), index + 1, parentId || '', columnId || '');
                }}
                className="p-1 rounded"
                style={{ color: 'var(--color-accent)' }}
                title="Pegar aquí (después de este bloque)"
                aria-label="Pegar después de este bloque"
              >
                <ClipboardPaste size={14} />
              </button>
            )}

            {/* Duplicar bloque */}
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              title="Duplicar bloque" aria-label="Duplicar bloque">
              <Copy size={14} />
            </button>

            {/* Duplicar sección completa — solo LAYOUT y SABER_COLUMNS */}
            {(block.type === BlockType.LAYOUT || block.type === BlockType.SABER_COLUMNS) && onDuplicateSection && (
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicateSection(block.id); }}
                className="p-1 rounded"
                style={{ color: 'var(--color-text-muted)' }}
                title="Duplicar sección completa" aria-label="Duplicar sección completa">
                <CopyPlus size={14} />
              </button>
            )}

            {/* Eliminar */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
              className="p-1 rounded"
              style={{ color: '#F87171' }}
              title="Eliminar bloque" aria-label="Eliminar bloque">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div>{renderContent()}</div>

        {/* ── INSTRUCCIÓN POR TIPO (solo si vacío y en edición) ── */}
        {!preview && isBlockEmpty(block) && BLOCK_HINTS[block.type] && (
          <div className="flex items-start gap-2 mx-2 mb-2 mt-1.5 px-3 py-2 rounded-lg select-none pointer-events-none"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 7%, transparent)', border: '1px dashed color-mix(in srgb, var(--color-accent) 28%, transparent)' }}>
            <Info size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }}/>
            {/* --color-text-label (#4D4F82) está pensado para el canvas claro (#FFFFFF);
                en modo oscuro el canvas pasa a #16134A y ese gris-índigo queda casi ilegible. */}
            <span style={{ color: darkMode ? 'var(--color-text-active)' : 'var(--color-text-label)', fontSize: '11px', lineHeight: '1.5' }}>
              {BLOCK_HINTS[block.type]}
            </span>
          </div>
        )}
      </div>
    </>
  );
};