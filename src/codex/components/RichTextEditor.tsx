import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Eraser, Code, Palette, Table as TableIcon, Link as LinkIcon, Check, X, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sigma, Image as ImageIcon, ZoomIn, Indent, Outdent, ChevronDown, Columns } from 'lucide-react-codex';
import { cleanPastedHTML, plainTextToHTML } from '../utils/pasteCleanup';

// --- TIPOS ---

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
}

// --- COMPONENTE PRINCIPAL ---

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className, rows = 4, placeholder }) => {

  // --- ESTADO ---

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [htmlMode, setHtmlMode] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showListOptions, setShowListOptions] = useState(false);
  const [inOrderedList, setInOrderedList] = useState(false);
  const [olType, setOlType] = useState('1');
  const [olStartInput, setOlStartInput] = useState('1');
  const currentOlRef = useRef<HTMLElement | null>(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });
  const [currentFormat, setCurrentFormat] = useState('p');

  // Estado de modales
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);

  // Campos del modal de enlace
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);

  // Campos de otros modales
  const [mathLatex, setMathLatex] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgWidth, setImgWidth] = useState('100%');
  const [imgLightbox, setImgLightbox] = useState(false);

  // --- EFECTOS ---

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current && !htmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, htmlMode]);

  const updateFormatState = useCallback(() => {
    if (!editorRef.current || document.activeElement !== editorRef.current) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
      // Traversal directo: más confiable que queryCommandValue('formatBlock')
      const BLOCK_FORMATS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote']);
      const SUPPORTED_OPTIONS = new Set(['p', 'h3', 'h4', 'h5', 'pre']);
      const sel2 = window.getSelection();
      let detectedFormat = 'p';
      if (sel2 && sel2.rangeCount > 0) {
        let node: Node | null = sel2.anchorNode;
        while (node && node !== editorRef.current) {
          const tag = (node as Element).tagName?.toLowerCase();
          if (tag && BLOCK_FORMATS.has(tag)) { detectedFormat = tag; break; }
          node = node.parentNode;
        }
      }
      setCurrentFormat(SUPPORTED_OPTIONS.has(detectedFormat) ? detectedFormat : 'p');
      // Detectar si el cursor está dentro de un <ol>
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node.nodeName !== 'OL' && node !== editorRef.current) node = node.parentNode;
        if (node && node.nodeName === 'OL') {
          const ol = node as HTMLElement;
          currentOlRef.current = ol;
          const type = ol.getAttribute('type') || '1';
          const start = parseInt(ol.getAttribute('start') || '1', 10);
          setInOrderedList(true);
          setOlType(type);
          if (type === 'A') setOlStartInput(String.fromCharCode(64 + start));
          else if (type === 'a') setOlStartInput(String.fromCharCode(96 + start));
          else setOlStartInput(String(start));
        } else {
          currentOlRef.current = null;
          setInOrderedList(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateFormatState);
    return () => document.removeEventListener('selectionchange', updateFormatState);
  }, [updateFormatState]);

  // --- GESTIÓN DEL CURSOR ---

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        return savedRangeRef.current;
      }
    }
    return null;
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    } else {
      editorRef.current?.focus();
    }
  };

  // --- HANDLERS DE CONTENIDO ---

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // execCommand('insertHTML') fusiona el contenido pegado con lo que ya hay en el punto del
  // cursor (ReplaceSelectionCommand de Blink/WebKit) y en esa fusión se come el espacio "normal"
  // limítrofe: "palabra " + cursor + "<em>otra</em>" queda "palabra<em>otra</em>". Un espacio
  // &nbsp; no se considera colapsable y sobrevive a la fusión, así que protegemos ambos lados
  // del punto de inserción convirtiendo el espacio limítrofe a &nbsp; antes de pegar.
  // Usamos CharacterData.replaceData (no .textContent) porque mutar textContent resetea el
  // Range a offset 0 en Chrome; replaceData ajusta el Range correctamente.
  const protectExistingBoundarySpace = (range: Range) => {
    if (!range.collapsed) return;
    const c = range.startContainer;
    const off = range.startOffset;
    if (c.nodeType === Node.TEXT_NODE && off > 0 && (c as CharacterData).data[off - 1] === ' ') {
      (c as CharacterData).replaceData(off - 1, 1, ' ');
      range.setStart(c, off);
      range.collapse(true);
    }
  };

  const protectPastedBoundarySpaces = (html: string): string => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) textNodes.push(n as Text);
    if (textNodes.length === 0) return html;
    const first = textNodes[0];
    if (first.data.startsWith(' ')) first.data = ' ' + first.data.slice(1);
    const last = textNodes[textNodes.length - 1];
    if (last.data.endsWith(' ')) last.data = last.data.slice(0, -1) + ' ';
    return template.innerHTML;
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const content = html?.trim() ? cleanPastedHTML(html) : plainTextToHTML(text);

    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      protectExistingBoundarySpace(range);
    }
    document.execCommand('insertHTML', false, protectPastedBoundarySpaces(content));
    handleInput();
  };

  const formatHTML = (html: string) => {
    const BLOCK = new Set(['div','p','ul','ol','li','table','thead','tbody','tfoot','tr','td','th','h1','h2','h3','h4','h5','h6','section','article','header','footer','nav','aside','main','pre','blockquote','figure','figcaption','form','fieldset','details','summary','dialog']);
    const VOID  = new Set(['img','input','br','hr','link','meta','area','base','col','embed','param','source','track','wbr']);
    const h = html.replace(/>(\s*[\n\r]+\s*)</g, (match, _sp, offset) => {
      const prevTag = html.slice(0, offset + 1).match(/<\/?([a-zA-Z0-9]+)[^>]*>$/)?.[1]?.toLowerCase() ?? '';
      const nextTag = html.slice(offset + match.length - 1).match(/^<\/?([a-zA-Z0-9]+)/)?.[1]?.toLowerCase() ?? '';
      if (BLOCK.has(prevTag) || BLOCK.has(nextTag)) return '><';
      return '> <';
    }).trim();
    const tokens = h.match(/<[^>]+>|[^<]+/g) || [];
    let result = ''; let indent = 0; const tab = '  '; let lastWasBlock = true;
    tokens.forEach(token => {
      if (token.startsWith('</')) {
        const tn = (token.match(/^<\/([a-z0-9]+)/i)?.[1] ?? '').toLowerCase();
        if (BLOCK.has(tn)) {
          indent = Math.max(0, indent - 1);
          result += (lastWasBlock ? '\n' + tab.repeat(indent) : '') + token;
          lastWasBlock = true;
        } else { result += token; lastWasBlock = false; }
      } else if (token.startsWith('<')) {
        const tn = (token.match(/^<([a-z0-9]+)/i)?.[1] ?? '').toLowerCase();
        if (BLOCK.has(tn)) {
          result += (result ? '\n' : '') + tab.repeat(indent) + token;
          if (!VOID.has(tn) && !token.endsWith('/>')) indent++;
          lastWasBlock = true;
        } else { result += token; lastWasBlock = false; }
      } else {
        // Preserve inline spaces (e.g. ' ' between </strong> and <em>).
        // Skip only structural whitespace that contains newlines.
        if (token.trim() || !/[\n\r]/.test(token)) { result += token; lastWasBlock = false; }
      }
    });
    return result;
  };

  // --- COMANDOS DE FORMATO ---

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const applyColor = (cls: string) => {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return;
    let n = s.anchorNode;
    while (n && n !== editorRef.current) n = n.parentNode;
    if (n !== editorRef.current) return;

    if (!cls) {
      // Quitar color: desenvuelve todos los span/b con text-* que intersecten la selección
      const range = s.getRangeAt(0).cloneRange();
      const colorEls = Array.from(editorRef.current!.querySelectorAll('span, b')).filter(
        el => /\btext-/.test(el.className) && range.intersectsNode(el)
      );
      colorEls.forEach(el => {
        const parent = el.parentNode!;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
      // Restaura la selección: desenvolver solo quita el <span>, el texto (y por tanto
      // los límites del range clonado) sigue en el mismo lugar del árbol. Antes se hacía
      // removeAllRanges() sin restaurar nada, dejando el editor sin cursor hasta re-clicar.
      s.removeAllRanges();
      s.addRange(range);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      setShowPalette(false);
      return;
    }

    const sp = document.createElement('span');
    sp.className = cls;
    try { s.getRangeAt(0).surroundContents(sp); }
    catch (e) { const c = s.getRangeAt(0).extractContents(); sp.appendChild(c); s.getRangeAt(0).insertNode(sp); }
    // Aplanar spans de color anidados
    Array.from(sp.querySelectorAll('span')).forEach(child => {
      if (/\btext-/.test(child.className)) {
        const parent = child.parentNode!;
        while (child.firstChild) parent.insertBefore(child.firstChild, child);
        parent.removeChild(child);
      }
    });
    // Deja el cursor justo después del span coloreado, listo para seguir escribiendo
    // (antes quedaba sin ninguna selección activa tras aplicar el color).
    const afterRange = document.createRange();
    afterRange.setStartAfter(sp);
    afterRange.collapse(true);
    s.removeAllRanges();
    s.addRange(afterRange);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setShowPalette(false);
  };

  const applyListStyle = (type: 'decimal' | 'upper-alpha' | 'lower-alpha' | 'upper-roman') => {
    const typeMap = { decimal: '1', 'upper-alpha': 'A', 'lower-alpha': 'a', 'upper-roman': 'I' };
    const selection = window.getSelection();

    // Si ya estamos en un OL, solo cambiar el tipo sin togglear
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      while (node && node.nodeName !== 'OL' && node !== editorRef.current) node = node.parentNode;
      if (node && node.nodeName === 'OL') {
        (node as HTMLElement).setAttribute('type', typeMap[type]);
        setShowListOptions(false);
        handleInput();
        return;
      }
    }

    // No estamos en un OL: crear uno y asignar tipo
    document.execCommand('insertOrderedList');
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      while (node && node.nodeName !== 'OL' && node !== editorRef.current) node = node.parentNode;
      if (node && node.nodeName === 'OL') {
        (node as HTMLElement).setAttribute('type', typeMap[type]);
      }
    }
    setShowListOptions(false);
    handleInput();
  };

  const applyListStart = (value: string) => {
    const ol = currentOlRef.current;
    if (!ol) return;
    const type = ol.getAttribute('type') || '1';
    let numeric: number;
    if (type === 'A') numeric = Math.max(1, value.toUpperCase().charCodeAt(0) - 64);
    else if (type === 'a') numeric = Math.max(1, value.toLowerCase().charCodeAt(0) - 96);
    else numeric = Math.max(1, parseInt(value, 10) || 1);
    ol.setAttribute('start', String(numeric));
    handleInput();
  };

  // --- MODAL: ENLACE ---

  const openLinkModal = (e: React.MouseEvent) => {
    e.preventDefault();
    const range = saveSelection();
    if (range) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode!;
      let anchor = node as HTMLElement;
      while (anchor && anchor.nodeName !== 'A' && anchor !== editorRef.current) {
        anchor = anchor.parentNode as HTMLElement;
      }
      if (anchor && anchor.nodeName === 'A') {
        setIsEditingLink(true);
        setLinkUrl((anchor as HTMLAnchorElement).getAttribute('href') || '');
        setLinkText(anchor.textContent || '');
        setLinkTargetBlank((anchor as HTMLAnchorElement).target === '_blank');
        const newRange = document.createRange();
        newRange.selectNode(anchor);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      } else {
        setIsEditingLink(false);
        setLinkUrl('');
        setLinkText(range.toString());
        setLinkTargetBlank(true);
      }
    }
    setShowLinkModal(true);
  };

  const applyLink = () => {
    restoreSelection();
    if (linkUrl) {
      const target = linkTargetBlank ? ' target="_blank"' : '';
      const txt = linkText || linkUrl;
      document.execCommand('insertHTML', false, `<a href="${linkUrl}"${target}>${txt}</a>`);
    } else if (isEditingLink) {
      document.execCommand('unlink', false);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setShowLinkModal(false);
    savedRangeRef.current = null;
  };

  const removeLink = () => {
    restoreSelection();
    document.execCommand('unlink', false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setShowLinkModal(false);
    savedRangeRef.current = null;
  };

  // --- MODAL: FÓRMULA ---

  const openMathModal = (e: React.MouseEvent) => {
    e.preventDefault();
    const range = saveSelection();
    if (range) {
      const text = range.toString().trim();
      const mathMatch = text.match(/^\$\$(.*)\$\$$/);
      setMathLatex(mathMatch ? mathMatch[1].trim() : '');
    } else {
      setMathLatex('');
    }
    setShowMathModal(true);
  };

  const translateWordToMoodleLatex = (latex: string): string => {
    return latex
      .replace(/Δ/g, '\\Delta ')
      .replace(/∑/g, '\\sum ')
      .replace(/∫/g, '\\int ')
      .trim();
  };

  const applyMath = () => {
    restoreSelection();
    if (mathLatex) {
      const fl = translateWordToMoodleLatex(mathLatex);
      document.execCommand('insertText', false, ` $$ ${fl} $$ `);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setShowMathModal(false);
    savedRangeRef.current = null;
  };

  // --- MODAL: IMAGEN ---

  const openImageModal = (e: React.MouseEvent) => {
    e.preventDefault();
    saveSelection();
    setImgUrl('');
    setImgAlt('');
    setShowImageModal(true);
  };

  const applyImage = () => {
    restoreSelection();
    if (imgUrl) {
      let content = `<img src="${imgUrl}" alt="${imgAlt}" role="presentation" class="img-fluid atto_image_button_text-bottom mt-1" style="width:${imgWidth};" />`;
      if (imgLightbox) content = `<a href="${imgUrl}" data-lightbox="image">${content}</a>`;
      document.execCommand('insertHTML', false, `<p class="text-center">${content}</p><p><br></p>`);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setShowImageModal(false);
    savedRangeRef.current = null;
  };

  // --- MODAL: GRILLA ---

  const openGridModal = (e: React.MouseEvent) => { e.preventDefault(); saveSelection(); setShowGridModal(true); };

  const insertGrid = (layout: string) => {
    restoreSelection();
    const content = '<p>Escribe aquí...</p>';
    const grids: Record<string, string> = {
      '1col':      `<div class="row"><div class="col-12">${content}</div></div>`,
      '2col-50':   `<div class="row"><div class="col-md-6">${content}</div><div class="col-md-6">${content}</div></div>`,
      '2col-30-70':`<div class="row"><div class="col-md-4">${content}</div><div class="col-md-8">${content}</div></div>`,
      '2col-70-30':`<div class="row"><div class="col-md-8">${content}</div><div class="col-md-4">${content}</div></div>`,
      '3col':      `<div class="row"><div class="col-md-4">${content}</div><div class="col-md-4">${content}</div><div class="col-md-4">${content}</div></div>`,
    };
    if (grids[layout]) {
      document.execCommand('insertHTML', false, `<p><br></p>${grids[layout]}<p><br></p>`);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
    setShowGridModal(false);
    savedRangeRef.current = null;
  };

  // --- TABLA ---

  const insertTable = () => {
    saveSelection();
    restoreSelection();
    document.execCommand('insertHTML', false, `<table class="table table-bordered table-striped"><tbody><tr class="text-white bg-info"><td><strong>H1</strong></td><td><strong>H2</strong></td></tr><tr><td>D1</td><td>D2</td></tr></tbody></table><br>`);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // --- RENDER: MODO HTML ---

  if (htmlMode) {
    return (
      <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm relative">
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-bold text-gray-500 uppercase">Modo HTML</span>
          <button onClick={() => setHtmlMode(false)} className="px-2 py-1 rounded hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center gap-1 transition-colors">
            <Code size={14} /> Volver a Visual
          </button>
        </div>
        <textarea
          value={formatHTML(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-3 text-sm font-mono focus:outline-none focus:bg-blue-50/20 resize-y ${className}`}
          style={{ minHeight: `${rows * 1.5}rem`, maxHeight: '400px' }}
          rows={rows}
        />
      </div>
    );
  }

  // --- RENDER: MODO VISUAL ---

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow shadow-sm ${className} relative`}>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex items-center gap-1 p-1.5 bg-gray-50 border-b border-gray-200 flex-wrap select-none relative z-10">

        {/* Bloque: Formato de bloque */}
        <select
          value={currentFormat}
          onChange={(e) => { exec('formatBlock', e.target.value); setCurrentFormat(e.target.value); }}
          className="h-7 text-xs border border-gray-300 rounded bg-white text-gray-700 px-1 outline-none focus:border-blue-500 mr-1 cursor-pointer"
        >
          <option value="p">Párrafo</option>
          <option value="h3">Título 3</option>
          <option value="h4">Título 4</option>
          <option value="h5">Título 5</option>
          <option value="pre">Preformateado</option>
        </select>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Negrita / Cursiva / Subrayado */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} title="Negrita" aria-label="Negrita" className={`p-2 rounded transition-all active:scale-95 ${activeFormats.bold ? 'bg-blue-100 text-blue-600 font-bold' : 'hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900'}`}><Bold size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} title="Cursiva" aria-label="Cursiva" className={`p-2 rounded transition-all active:scale-95 ${activeFormats.italic ? 'bg-blue-100 text-blue-600' : 'hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900'}`}><Italic size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} title="Subrayado" aria-label="Subrayado" className={`p-2 rounded transition-all active:scale-95 ${activeFormats.underline ? 'bg-blue-100 text-blue-600' : 'hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900'}`}><Underline size={15}/></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Alineación */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }} title="Alinear Izquierda" aria-label="Alinear a la izquierda" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><AlignLeft size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }} title="Centrar" aria-label="Centrar texto" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><AlignCenter size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }} title="Alinear Derecha" aria-label="Alinear a la derecha" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><AlignRight size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }} title="Justificar" aria-label="Justificar texto" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><AlignJustify size={15}/></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Color de texto */}
        <div className="relative">
          <button onMouseDown={(e) => { e.preventDefault(); setShowPalette(!showPalette); }} title="Color de Texto" className={`p-1.5 rounded hover:bg-white hover:shadow text-gray-700 transition-all ${showPalette ? 'bg-blue-100 text-blue-600' : ''}`}><Palette size={16}/></button>
          {showPalette && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-2 z-50 grid grid-cols-4 gap-1 w-32" role="menu" aria-label="Colores de texto">
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-primary'); }} className="w-6 h-6 rounded bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-600" title="Azul" aria-label="Color azul"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-info'); }} className="w-6 h-6 rounded bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-cyan-500" title="Cyan" aria-label="Color cyan"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-purple'); }} className="w-6 h-6 rounded bg-[#5a31b5] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5a31b5]" title="Morado" aria-label="Color morado"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-orange'); }} className="w-6 h-6 rounded bg-[#e0421f] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#e0421f]" title="Naranja" aria-label="Color naranja"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-success'); }} className="w-6 h-6 rounded bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-600" title="Verde" aria-label="Color verde"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-danger'); }} className="w-6 h-6 rounded bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600" title="Rojo" aria-label="Color rojo"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor('text-warning'); }} className="w-6 h-6 rounded bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500" title="Amarillo" aria-label="Color amarillo"></button>
              <button onMouseDown={(e) => { e.preventDefault(); applyColor(''); }} className="w-6 h-6 rounded bg-black flex items-center justify-center text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-800" title="Sin color" aria-label="Quitar color">Tx</button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Listas */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} title="Lista con viñetas" aria-label="Lista con viñetas" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><List size={15}/></button>
        <div className="relative">
          <button onMouseDown={(e) => { e.preventDefault(); setShowListOptions(!showListOptions); }} title="Tipos de Lista Ordenada" className={`p-1.5 rounded hover:bg-white hover:shadow text-gray-700 flex items-center gap-0.5 ${showListOptions ? 'bg-blue-100 text-blue-600' : ''}`}>
            <ListOrdered size={16}/><ChevronDown size={10} className="opacity-50"/>
          </button>
          {showListOptions && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-1 z-50 flex flex-col gap-1 min-w-[140px]">
              <button onMouseDown={(e) => { e.preventDefault(); applyListStyle('decimal'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"><span className="font-mono text-gray-400 font-bold w-4 text-center">1.</span> Números</button>
              <button onMouseDown={(e) => { e.preventDefault(); applyListStyle('upper-alpha'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"><span className="font-mono text-gray-400 font-bold w-4 text-center">A.</span> Letras Mayús.</button>
              <button onMouseDown={(e) => { e.preventDefault(); applyListStyle('lower-alpha'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"><span className="font-mono text-gray-400 font-bold w-4 text-center">a.</span> Letras Minús.</button>
              <button onMouseDown={(e) => { e.preventDefault(); applyListStyle('upper-roman'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"><span className="font-mono text-gray-400 font-bold w-4 text-center">I.</span> Romanos</button>
            </div>
          )}
        </div>

        {/* Inicio de lista ordenada — visible solo cuando cursor está en un OL */}
        {inOrderedList && (
          <div className="flex items-center gap-1 ml-0.5 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700">
            <span className="text-[10px] font-semibold whitespace-nowrap">desde:</span>
            {olType === 'A' || olType === 'a' ? (
              <input
                type="text"
                maxLength={1}
                value={olStartInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^[a-zA-Z]$/.test(v)) { setOlStartInput(v); applyListStart(v); }
                  else if (v === '') setOlStartInput('');
                }}
                onBlur={(e) => { if (!e.target.value) { setOlStartInput(olType === 'A' ? 'A' : 'a'); } }}
                className="w-7 h-5 text-center text-xs border border-blue-300 rounded bg-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                title={`Letra inicial (${olType === 'A' ? 'A–Z' : 'a–z'})`}
              />
            ) : (
              <input
                type="number"
                min="1"
                max="9999"
                value={olStartInput}
                onChange={(e) => {
                  setOlStartInput(e.target.value);
                  if (parseInt(e.target.value, 10) >= 1) applyListStart(e.target.value);
                }}
                onBlur={(e) => { if (!e.target.value || parseInt(e.target.value, 10) < 1) { setOlStartInput('1'); applyListStart('1'); } }}
                className="w-12 h-5 text-center text-xs border border-blue-300 rounded bg-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                title="Número inicial de la lista"
              />
            )}
          </div>
        )}

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Sangría */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('outdent'); }} title="Disminuir Sangría" aria-label="Disminuir sangría" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><Outdent size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('indent'); }} title="Aumentar Sangría" aria-label="Aumentar sangría" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><Indent size={15}/></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Insertar */}
        <button onMouseDown={openMathModal} title="Fórmula LaTeX" aria-label="Insertar fórmula LaTeX" aria-expanded={showMathModal} className={`p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95 ${showMathModal ? 'bg-blue-100 text-blue-600' : ''}`}><Sigma size={15}/></button>
        <button onMouseDown={openImageModal} title="Insertar Imagen" aria-label="Insertar imagen" aria-expanded={showImageModal} className={`p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95 ${showImageModal ? 'bg-blue-100 text-blue-600' : ''}`}><ImageIcon size={15}/></button>
        <button onMouseDown={openLinkModal} title="Insertar Enlace" aria-label="Insertar enlace" aria-expanded={showLinkModal} className={`p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95 ${showLinkModal ? 'bg-blue-100 text-blue-600' : ''}`}><LinkIcon size={15}/></button>
        <button onMouseDown={(e) => { e.preventDefault(); insertTable(); }} title="Insertar Tabla" aria-label="Insertar tabla" className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95"><TableIcon size={15}/></button>
        <button onMouseDown={openGridModal} title="Insertar Grilla" aria-label="Insertar grilla de columnas" aria-expanded={showGridModal} className={`p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900 transition-all active:scale-95 ${showGridModal ? 'bg-blue-100 text-blue-600' : ''}`}><Columns size={15}/></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Bloque: Utilidades */}
        <button onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} title="Limpiar Formato" aria-label="Limpiar formato" className="p-2 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all active:scale-95"><Eraser size={15}/></button>
        <button onClick={() => setHtmlMode(true)} title="Ver HTML" aria-label="Ver código HTML" className="p-2 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 ml-auto transition-all active:scale-95"><Code size={15}/></button>
      </div>

      {/* MODAL: ENLACE */}
      {showLinkModal && (
        <div className="absolute top-10 left-0 w-full bg-white border border-gray-300 shadow-xl rounded-lg p-3 z-50 flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">{isEditingLink ? 'Editar Enlace' : 'Insertar Enlace'}</span>
          <input type="text" placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-1 w-full" autoFocus />
          <input type="text" placeholder="Texto" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-1 w-full" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="linkTarget" checked={linkTargetBlank} onChange={(e) => setLinkTargetBlank(e.target.checked)} className="rounded border-gray-300 text-blue-600"/>
            <label htmlFor="linkTarget" className="text-xs text-gray-700 cursor-pointer">Nueva pestaña</label>
          </div>
          <div className="flex justify-between items-center mt-1">
            {isEditingLink
              ? <button onClick={removeLink} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-medium">Quitar enlace</button>
              : <span/>
            }
            <div className="flex gap-2">
              <button onClick={() => setShowLinkModal(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={16}/></button>
              <button onClick={applyLink} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Check size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FÓRMULA */}
      {showMathModal && (
        <div className="absolute top-10 left-0 w-full bg-white border border-gray-300 shadow-xl rounded-lg p-3 z-[100] flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Fórmula (LaTeX)</span>
          <textarea placeholder="Ej: \delta W_b = \mathbf{Fds}" value={mathLatex} onChange={(e) => setMathLatex(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-2 font-mono h-24 resize-none w-full" autoFocus />
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setShowMathModal(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={16}/></button>
            <button onClick={applyMath} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Check size={16}/></button>
          </div>
        </div>
      )}

      {/* MODAL: IMAGEN */}
      {showImageModal && (
        <div className="absolute top-10 left-0 w-full bg-white border border-gray-300 shadow-xl rounded-lg p-3 z-[100] flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Insertar Imagen</span>
          <input type="text" placeholder="URL" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-1 w-full" autoFocus />
          <input type="text" placeholder="Descripción (Alt)" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-1 w-full" />
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Ancho:</span>
              <select value={imgWidth} onChange={(e) => setImgWidth(e.target.value)} className="text-xs border border-gray-300 rounded px-1 py-1">
                <option value="25%">25%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1 bg-gray-50 cursor-pointer" onClick={() => setImgLightbox(!imgLightbox)}>
              <div className={`w-3 h-3 rounded border flex items-center justify-center ${imgLightbox ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}`}>
                {imgLightbox && <Check size={10} className="text-white" />}
              </div>
              <span className="text-xs font-medium text-gray-600 select-none flex items-center gap-1"><ZoomIn size={12}/> Lightbox</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowImageModal(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={16}/></button>
            <button onClick={applyImage} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Check size={16}/></button>
          </div>
        </div>
      )}

      {/* MODAL: GRILLA */}
      {showGridModal && (
        <div className="absolute top-10 left-0 w-56 bg-white border border-gray-300 shadow-xl rounded-lg p-2 z-[100] flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-500 uppercase px-1 mb-1">Insertar Estructura</span>
          <button onMouseDown={(e) => { e.preventDefault(); insertGrid('1col'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2 group">
            <div className="w-full h-3 bg-gray-200 border border-gray-300 rounded group-hover:bg-blue-100 group-hover:border-blue-300"></div> 1 Columna
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); insertGrid('2col-50'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2 group">
            <div className="w-1/2 h-3 bg-gray-200 border border-gray-300 rounded-l group-hover:bg-blue-100 group-hover:border-blue-300"></div>
            <div className="w-1/2 h-3 bg-gray-200 border border-gray-300 rounded-r group-hover:bg-blue-100 group-hover:border-blue-300"></div> 2 Cols (50/50)
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); insertGrid('2col-30-70'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2 group">
            <div className="w-1/3 h-3 bg-gray-200 border border-gray-300 rounded-l group-hover:bg-blue-100 group-hover:border-blue-300"></div>
            <div className="w-2/3 h-3 bg-gray-200 border border-gray-300 rounded-r group-hover:bg-blue-100 group-hover:border-blue-300"></div> 2 Cols (30/70)
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); insertGrid('2col-70-30'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2 group">
            <div className="w-2/3 h-3 bg-gray-200 border border-gray-300 rounded-l group-hover:bg-blue-100 group-hover:border-blue-300"></div>
            <div className="w-1/3 h-3 bg-gray-200 border border-gray-300 rounded-r group-hover:bg-blue-100 group-hover:border-blue-300"></div> 2 Cols (70/30)
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); insertGrid('3col'); }} className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2 group">
            <div className="w-1/3 h-3 bg-gray-200 border border-gray-300 rounded-l group-hover:bg-blue-100 group-hover:border-blue-300"></div>
            <div className="w-1/3 h-3 bg-gray-200 border border-gray-300 group-hover:bg-blue-100 group-hover:border-blue-300"></div>
            <div className="w-1/3 h-3 bg-gray-200 border border-gray-300 rounded-r group-hover:bg-blue-100 group-hover:border-blue-300"></div> 3 Cols
          </button>
          <div className="border-t my-1"></div>
          <button onClick={() => setShowGridModal(false)} className="text-xs text-center w-full p-1 text-gray-400 hover:text-red-500">Cancelar</button>
        </div>
      )}

      {/* ÁREA DE EDICIÓN */}
      <div
        ref={editorRef}
        contentEditable
        spellCheck={true}
        lang="es"
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder || "Editor de contenido"}
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-3 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset overflow-y-auto rich-editor-content no-scrollbar"
        style={{ minHeight: `${rows * 1.5}rem`, maxHeight: '400px' }}
        data-placeholder={placeholder}
      />

      {/* ESTILOS INTERNOS */}
      <style>{`
        .rich-editor-content {
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
          color: #212529;
        }
        .rich-editor-content p { margin-bottom: 0.5em !important; }

        /* Listas — respetar atributo type del OL */
        .rich-editor-content ul { list-style-type: disc !important; margin-left: 1.5em !important; }
        .rich-editor-content ol { list-style-type: decimal; margin-left: 1.5em !important; }
        .rich-editor-content ol[type="A"] { list-style-type: upper-alpha !important; }
        .rich-editor-content ol[type="a"] { list-style-type: lower-alpha !important; }
        .rich-editor-content ol[type="I"] { list-style-type: upper-roman !important; }
        .rich-editor-content ol[type="i"] { list-style-type: lower-roman !important; }

        /* Colores */
        .rich-editor-content .text-primary { color: #2563eb !important; }
        .rich-editor-content .text-info    { color: #07b3c1 !important; }
        .rich-editor-content .text-purple  { color: #5a31b5 !important; }
        .rich-editor-content .text-orange  { color: #e0421f !important; }
        .rich-editor-content .text-success { color: #16a34a !important; }
        .rich-editor-content .text-danger  { color: #dc2626 !important; }
        .rich-editor-content .text-warning { color: #eab308 !important; }
        .rich-editor-content .text-white   { color: #ffffff !important; }

        /* Formato inline */
        .rich-editor-content b, .rich-editor-content strong { font-weight: 700 !important; }
        .rich-editor-content i, .rich-editor-content em     { font-style: italic !important; }
        .rich-editor-content u { text-decoration: underline !important; }
        .rich-editor-content a { color: #2563eb; text-decoration: underline; cursor: pointer; }

        /* Tablas */
        .rich-editor-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-bottom: 1em;
          background-color: transparent !important;
        }
        .rich-editor-content td,
        .rich-editor-content th {
          border: 1px solid #dee2e6 !important;
          padding: 0.75rem !important;
          vertical-align: top;
          background-color: white !important;
        }
        .rich-editor-content tr:first-child td,
        .rich-editor-content tr:first-child th,
        .rich-editor-content thead tr th,
        .rich-editor-content tr.bg-info td {
          background-color: #07b3c1 !important;
          color: #ffffff !important;
          font-weight: bold !important;
          border-bottom: 2px solid #dee2e6 !important;
        }
        .rich-editor-content tr:first-child p,
        .rich-editor-content tr:first-child span,
        .rich-editor-content tr:first-child strong,
        .rich-editor-content tr:first-child b,
        .rich-editor-content tr.bg-info p,
        .rich-editor-content tr.bg-info span {
          color: #ffffff !important;
          margin-bottom: 0 !important;
        }

        /* Grilla */
        .rich-editor-content .row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -5px;
          margin-left: -5px;
          border: 1px dashed #e5e7eb;
          padding: 5px;
          margin-bottom: 10px;
        }
        .rich-editor-content [class*="col-"] {
          position: relative;
          width: 100%;
          padding-right: 5px;
          padding-left: 5px;
          border: 1px dotted #cbd5e1;
          min-height: 40px;
          background-color: #f8fafc;
        }
        .rich-editor-content .col-md-12,.rich-editor-content .col-12 { flex: 0 0 100%;        max-width: 100%;        }
        .rich-editor-content .col-md-6  { flex: 0 0 50%;         max-width: 50%;         }
        .rich-editor-content .col-md-4  { flex: 0 0 33.333333%;  max-width: 33.333333%;  }
        .rich-editor-content .col-md-8  { flex: 0 0 66.666667%;  max-width: 66.666667%;  }
        .rich-editor-content .col-md-3  { flex: 0 0 25%;         max-width: 25%;         }
        .rich-editor-content .col-md-9  { flex: 0 0 75%;         max-width: 75%;         }

        /* Placeholder cuando el editor está vacío */
        .rich-editor-content[data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
