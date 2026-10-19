import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BlockData, BlockType, BlockUpdate } from '../types';
import { Layout, Plus, Trash2, Type, AlignLeft, AlignCenter, AlignRight, Lightbulb } from 'lucide-react-codex';
import { RichTextEditor } from './RichTextEditor';
import { IconPicker } from './IconPicker';

interface PropertiesPanelProps {
  block: BlockData | null;
  onUpdate: (id: string, updates: BlockUpdate) => void;
  darkMode?: boolean;
}

const TYPE_NAMES: Record<string, string> = {
  heading: 'Título', text: 'Texto', image: 'Imagen', video: 'Video', table: 'Tabla',
  alert: 'Caja / Alerta', button: 'Botón', layout: 'Columnas', accordion: 'Acordeón',
  flipcard: 'Flip Card', icon_card: 'Tarjeta Icono', conclusion: 'Contenedor',
  podcast: 'Pódcast', tabs: 'Pestañas', citation: 'Icono + Texto', task: 'Tarea',
  forum: 'Foro', saber_columns: 'Cols. Saber/Hacer', questionnaire: 'Cuestionario',
  modal: 'Modal Popup', popover: 'Pista (Popover)', quiz: 'Pregunta', timeline: 'Timeline',
  stat_card: 'Estadísticas', section_banner: 'Banner Sección',
  blockquote: 'Cita Textual', download_card: 'Descarga', code_block: 'Código',
  collapse_icon: 'Colapso Icono', card_image: 'Card Imagen', divider: 'Separador',
  intro_card: 'Intro Saber',
};

const COLOR_HEX: Record<string, string> = {
  info: '#07b3c1', primary: '#2563eb', success: '#16a34a', danger: '#dc2626',
  warning: '#eab308', yellow: '#d4a000', purple: '#5a31b5', orange: '#e0421f',
  secondary: '#6c757d', 'text-primary': '#2563eb', 'text-info': '#07b3c1',
  'text-success': '#16a34a', 'text-danger': '#dc2626', 'text-warning': '#eab308',
  'text-purple': '#5a31b5', 'text-orange': '#e0421f', 'text-dark': '#212529',
  'bg-primary': '#2563eb', 'bg-info': '#07b3c1', 'bg-purple': '#5a31b5', 'bg-orange': '#e0421f',
};

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ColorDot: React.FC<{ color: string }> = ({ color }) => {
  const hex = COLOR_HEX[color];
  if (!hex) return null;
  return <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 inline-block" style={{ backgroundColor: hex }}/>;
};

// ─────────────────────────────────────────────
// TIPOS INTERNOS DEL EDITOR DE TABLA
// ─────────────────────────────────────────────
interface CellData {
  text: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  colspan: number;
  rowspan: number;
  isHeader: boolean;
  merged?: boolean;
}

type TableMatrix = CellData[][];

// ─────────────────────────────────────────────
// PARSEAR HTML → MATRIZ
// ─────────────────────────────────────────────
const htmlToMatrix = (html: string): TableMatrix => {
  if (!html || !html.trim()) return defaultMatrix(2, 2);
  try {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const rows = Array.from(wrapper.querySelectorAll('tr'));
    if (rows.length === 0) return defaultMatrix(2, 2);

    const maxCols = Math.max(...rows.map(r => {
      let c = 0;
      r.querySelectorAll('td,th').forEach(cell => { c += parseInt(cell.getAttribute('colspan') || '1'); });
      return c;
    }));

    const matrix: TableMatrix = Array.from({ length: rows.length }, () =>
      Array.from({ length: maxCols }, () => ({
        text: '', bold: false, align: 'left', colspan: 1, rowspan: 1, isHeader: false, merged: false
      }))
    );

    const occupied: boolean[][] = Array.from({ length: rows.length }, () => Array(maxCols).fill(false));

    rows.forEach((tr, ri) => {
      let ci = 0;
      const cells = Array.from(tr.querySelectorAll('td,th'));
      cells.forEach(cell => {
        while (ci < maxCols && occupied[ri][ci]) ci++;
        if (ci >= maxCols) return;

        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        const style = cell.getAttribute('style') || '';
        let align: 'left' | 'center' | 'right' = 'left';
        if (style.includes('center') || cell.getAttribute('align') === 'center') align = 'center';
        if (style.includes('right') || cell.getAttribute('align') === 'right') align = 'right';

        const innerText = (cell as HTMLElement).innerText || cell.textContent || '';
        const hasBold = !!cell.querySelector('strong,b');

        matrix[ri][ci] = { text: innerText.trim(), bold: hasBold, align, colspan, rowspan, isHeader: ri === 0, merged: false };

        for (let dr = 0; dr < rowspan; dr++) {
          for (let dc = 0; dc < colspan; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (ri + dr < rows.length && ci + dc < maxCols) {
              occupied[ri + dr][ci + dc] = true;
              if (matrix[ri + dr]) {
                matrix[ri + dr][ci + dc] = { text: '', bold: false, align: 'left', colspan: 1, rowspan: 1, isHeader: ri + dr === 0, merged: true };
              }
            }
          }
        }
        ci += colspan;
      });
    });

    return matrix;
  } catch {
    return defaultMatrix(2, 2);
  }
};

// ─────────────────────────────────────────────
// MATRIZ → HTML
// ─────────────────────────────────────────────
const matrixToHtml = (matrix: TableMatrix): string => {
  if (!matrix.length) return '';
  let html = '<table class="table table-bordered table-striped"><tbody>';
  matrix.forEach((row, ri) => {
    const isHeader = ri === 0;
    const rowClass = isHeader ? ' class="text-white bg-info"' : '';
    html += `<tr${rowClass}>`;
    row.forEach(cell => {
      if (cell.merged) return;
      const tag = isHeader ? 'th' : 'td';
      const colspanAttr = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
      const rowspanAttr = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
      const alignAttr = cell.align !== 'left' ? ` style="text-align:${cell.align}"` : '';
      const content = cell.bold ? `<strong>${cell.text}</strong>` : cell.text;
      html += `<${tag}${colspanAttr}${rowspanAttr}${alignAttr}>${content}</${tag}>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
};

const defaultMatrix = (rows: number, cols: number): TableMatrix =>
  Array.from({ length: rows }, (_, ri) =>
    Array.from({ length: cols }, () => ({
      text: ri === 0 ? 'Encabezado' : 'Dato',
      bold: ri === 0,
      align: 'left' as const,
      colspan: 1, rowspan: 1,
      isHeader: ri === 0,
      merged: false,
    }))
  );

// ─────────────────────────────────────────────
// COMPONENTE EDITOR DE TABLA VISUAL
// ─────────────────────────────────────────────
interface TableEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const TableEditor: React.FC<TableEditorProps> = ({ value, onChange }) => {
  const [matrix, setMatrix] = useState<TableMatrix>(() => htmlToMatrix(value));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  // Guarda el último HTML que ESTE componente emitió: cada commit() llama onChange, el
  // padre re-renderiza y "value" vuelve a bajar como prop — sin esta referencia, ese eco
  // de nuestro propio cambio disparaba el efecto de abajo y cerraba la celda en cada tecla.
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setMatrix(htmlToMatrix(value));
    setSelected(null);
    setEditingCell(null);
  }, [value]);

  const commit = useCallback((m: TableMatrix) => {
    setMatrix(m);
    const html = matrixToHtml(m);
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const updateCell = (r: number, c: number, patch: Partial<CellData>) => {
    const m = matrix.map(row => row.map(cell => ({ ...cell })));
    m[r][c] = { ...m[r][c], ...patch };
    commit(m);
  };

  const addRow = () => {
    const cols = matrix[0]?.length || 2;
    const newRow: CellData[] = Array.from({ length: cols }, () => ({
      text: 'Nuevo', bold: false, align: 'left', colspan: 1, rowspan: 1, isHeader: false, merged: false
    }));
    commit([...matrix, newRow]);
  };

  const removeRow = () => {
    if (matrix.length <= 1) return;
    commit(matrix.slice(0, -1));
  };

  const addCol = () => {
    const m = matrix.map(row => [...row, {
      text: row[0].isHeader ? 'Encabezado' : 'Dato',
      bold: row[0].isHeader, align: 'left' as const,
      colspan: 1, rowspan: 1, isHeader: row[0].isHeader, merged: false
    }]);
    commit(m);
  };

  const removeCol = () => {
    if (!matrix[0] || matrix[0].length <= 1) return;
    commit(matrix.map(row => row.slice(0, -1)));
  };

  const insertRowAt = (atIndex: number) => {
    const cols = matrix[0]?.length || 2;
    const newRow: CellData[] = Array.from({ length: cols }, () => ({
      text: 'Nuevo', bold: false, align: 'left', colspan: 1, rowspan: 1, isHeader: false, merged: false
    }));
    const m = [...matrix];
    m.splice(atIndex, 0, newRow);
    const fixed = m.map((row, ri) => row.map(cell => ({ ...cell, isHeader: ri === 0 })));
    commit(fixed);
    setSelected(null);
  };

  const deleteRowAt = (ri: number) => {
    if (matrix.length <= 1) return;
    const m = matrix.filter((_, i) => i !== ri);
    const fixed = m.map((row, i) => row.map(cell => ({ ...cell, isHeader: i === 0 })));
    commit(fixed);
    setSelected(null);
  };

  const insertColAt = (atCol: number) => {
    const m = matrix.map((row, ri) => {
      const newCell: CellData = { text: ri === 0 ? 'Encabezado' : 'Dato', bold: ri === 0, align: 'left', colspan: 1, rowspan: 1, isHeader: ri === 0, merged: false };
      const r = [...row];
      r.splice(atCol, 0, newCell);
      return r;
    });
    commit(m);
    setSelected(null);
  };

  const deleteColAt = (ci: number) => {
    if (!matrix[0] || matrix[0].length <= 1) return;
    commit(matrix.map(row => row.filter((_, i) => i !== ci)));
    setSelected(null);
  };

  const mergeRight = (r: number, c: number) => {
    const row = matrix[r];
    const cell = row[c];
    let nextC = c + cell.colspan;
    if (nextC >= row.length) return;
    while (nextC < row.length && row[nextC].merged) nextC++;
    if (nextC >= row.length) return;
    const m = matrix.map(row => row.map(cell => ({ ...cell })));
    m[r][c].colspan += m[r][nextC].colspan;
    m[r][nextC].merged = true;
    commit(m);
  };

  const mergeDown = (r: number, c: number) => {
    if (r + 1 >= matrix.length) return;
    const m = matrix.map(row => row.map(cell => ({ ...cell })));
    m[r][c].rowspan += 1;
    m[r + 1][c].merged = true;
    commit(m);
  };

  const splitCell = (r: number, c: number) => {
    const cell = matrix[r][c];
    if (cell.colspan === 1 && cell.rowspan === 1) return;
    const m = matrix.map(row => row.map(cell => ({ ...cell })));
    for (let dc = 1; dc < cell.colspan; dc++) {
      if (c + dc < m[r].length) m[r][c + dc].merged = false;
    }
    for (let dr = 1; dr < cell.rowspan; dr++) {
      if (r + dr < m.length && c < m[r + dr].length) m[r + dr][c].merged = false;
    }
    m[r][c].colspan = 1;
    m[r][c].rowspan = 1;
    commit(m);
  };

  const sel = selected;
  const selCell = sel ? matrix[sel.r]?.[sel.c] : null;
  const numRows = matrix.length;
  const numCols = matrix[0]?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-semibold mr-1">Filas:</span>
          <button onClick={addRow} title="Agregar fila al final" className="p-1.5 rounded bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"><Plus size={14}/></button>
          <button onClick={removeRow} title="Eliminar última fila" disabled={numRows <= 1} className="p-1.5 rounded bg-white border border-gray-300 hover:border-red-400 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 size={14}/></button>
        </div>
        <div className="w-px h-6 bg-gray-300 self-center"/>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-semibold mr-1">Cols:</span>
          <button onClick={addCol} title="Agregar columna al final" className="p-1.5 rounded bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"><Plus size={14}/></button>
          <button onClick={removeCol} title="Eliminar última columna" disabled={numCols <= 1} className="p-1.5 rounded bg-white border border-gray-300 hover:border-red-400 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 size={14}/></button>
        </div>
        <div className="ml-auto text-xs text-gray-400 self-center">{numRows} × {numCols}</div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className="w-6 bg-gray-50 border border-gray-200 p-0 text-center align-middle">
                  <div className="flex flex-col items-center gap-0.5 py-1 px-0.5">
                    <span className="text-[10px] text-gray-400 font-mono">{ri}</span>
                    <button onClick={() => insertRowAt(ri)} title="Insertar fila arriba" className="text-gray-300 hover:text-blue-500 transition-colors"><Plus size={10}/></button>
                    {ri > 0 && (
                      <button onClick={() => deleteRowAt(ri)} title="Eliminar esta fila" className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={10}/></button>
                    )}
                  </div>
                </td>

                {row.map((cell, ci) => {
                  if (cell.merged) return null;
                  const isSelected = sel?.r === ri && sel?.c === ci;
                  const isEditing = editingCell?.r === ri && editingCell?.c === ci;
                  const isHeaderRow = ri === 0;

                  return (
                    <td key={ci} colSpan={cell.colspan} rowSpan={cell.rowspan}
                      onClick={() => { setSelected({ r: ri, c: ci }); setEditingCell(null); }}
                      onDoubleClick={() => setEditingCell({ r: ri, c: ci })}
                      className={`border border-gray-300 p-0 relative cursor-pointer min-w-[80px] ${isHeaderRow ? 'bg-cyan-500' : 'bg-white'} ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : 'hover:bg-blue-50'}`}
                      style={{ textAlign: cell.align }}
                    >
                      {isEditing ? (
                        <input autoFocus value={cell.text}
                          onChange={e => updateCell(ri, ci, { text: e.target.value })}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null);
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              setEditingCell(null);
                              const nextCi = ci + 1 < numCols ? ci + 1 : 0;
                              const nextRi = ci + 1 < numCols ? ri : ri + 1;
                              if (nextRi < numRows) setSelected({ r: nextRi, c: nextCi });
                            }
                          }}
                          className={`w-full h-full px-2 py-1.5 outline-none bg-yellow-50 text-sm ${cell.bold ? 'font-bold' : ''} ${isHeaderRow ? 'text-white placeholder-white/70' : 'text-gray-800'}`}
                          placeholder="Texto..."
                        />
                      ) : (
                        <div className={`px-2 py-1.5 text-sm min-h-[32px] ${cell.bold ? 'font-bold' : ''} ${isHeaderRow ? 'text-white' : 'text-gray-800'}`}>
                          {cell.text || <span className="text-gray-300 italic text-xs">vacío</span>}
                        </div>
                      )}
                    </td>
                  );
                })}

                {ri === numRows - 1 && (<td className="w-4 bg-transparent border-0 p-0"/>)}
              </tr>
            ))}

            <tr>
              <td className="bg-transparent border-0"/>
              {matrix[0]?.map((_, ci) => (
                <td key={ci} className="bg-gray-50 border border-gray-200 p-0 text-center">
                  <div className="flex items-center justify-center gap-1 py-1">
                    <span className="text-[10px] text-gray-400 font-mono">{ci}</span>
                    <button onClick={() => insertColAt(ci)} title="Insertar columna aquí" className="text-gray-300 hover:text-blue-500 transition-colors"><Plus size={10}/></button>
                    {ci > 0 && (
                      <button onClick={() => deleteColAt(ci)} title="Eliminar esta columna" className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={10}/></button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 italic">Clic para seleccionar · Doble clic para editar · Tab para avanzar celda</p>

      {sel && selCell && !selCell.merged && (
        <div className="border border-blue-200 rounded-lg bg-blue-50 p-3 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            Celda [{sel.r}, {sel.c}]
            {sel.r === 0 && <span className="ml-2 text-cyan-600">(Encabezado)</span>}
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Contenido</label>
            <input type="text" value={selCell.text}
              onChange={e => updateCell(sel.r, sel.c, { text: e.target.value })}
              className="neu-input"
              placeholder="Texto de la celda..."
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => updateCell(sel.r, sel.c, { bold: !selCell.bold })}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${selCell.bold ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}
            >N (Negrita)</button>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => updateCell(sel.r, sel.c, { align: a })} title={a}
                  className={`p-1.5 transition-colors ${selCell.align === a ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  {a === 'left' ? <AlignLeft size={13}/> : a === 'center' ? <AlignCenter size={13}/> : <AlignRight size={13}/>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Combinar celdas</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => mergeRight(sel.r, sel.c)} disabled={sel.c + selCell.colspan >= numCols}
                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-colors">← → Unir derecha</button>
              <button onClick={() => mergeDown(sel.r, sel.c)} disabled={sel.r + selCell.rowspan >= numRows}
                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition-colors">↑ ↓ Unir abajo</button>
              {(selCell.colspan > 1 || selCell.rowspan > 1) && (
                <button onClick={() => splitCell(sel.r, sel.c)}
                  className="px-2 py-1 text-xs rounded border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">Separar</button>
              )}
            </div>
            {(selCell.colspan > 1 || selCell.rowspan > 1) && (
              <p className="text-xs text-gray-400 mt-1">
                Ocupa {selCell.colspan} col{selCell.colspan > 1 ? 's' : ''} × {selCell.rowspan} fila{selCell.rowspan > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Insertar relativo a esta celda</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => insertRowAt(sel.r)} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 transition-colors">+ Fila arriba</button>
              <button onClick={() => insertRowAt(sel.r + 1)} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 transition-colors">+ Fila abajo</button>
              <button onClick={() => insertColAt(sel.c)} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 transition-colors">+ Col izquierda</button>
              <button onClick={() => insertColAt(sel.c + 1)} className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:border-blue-400 hover:text-blue-600 transition-colors">+ Col derecha</button>
            </div>
          </div>

          {sel.r > 0 && (
            <button onClick={() => deleteRowAt(sel.r)} className="px-2 py-1 text-xs rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
              <Trash2 size={12} className="inline mr-1"/> Eliminar fila {sel.r}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AVISO: bloque con área anidada (reemplaza RichTextEditor)
// ─────────────────────────────────────────────
const AreaHint: React.FC<{ label?: string }> = ({ label }) => (
  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 flex items-start gap-2">
    <Lightbulb size={16} className="shrink-0 mt-0.5"/>
    <span>
      {label
        ? <><strong>{label}</strong> — Edita el contenido arrastrando bloques directamente al área en el canvas.</>
        : <>Edita el contenido arrastrando bloques directamente al área en el canvas.</>
      }
    </span>
  </div>
);

// ─────────────────────────────────────────────
// PROPERTIES PANEL PRINCIPAL
// ─────────────────────────────────────────────
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, onUpdate, darkMode = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [block?.id]);

  if (!block) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
        <Layout className="w-16 h-16 mb-4 opacity-10" style={{ color: 'var(--color-accent)' }}/>
        <p className="text-sm font-medium">Selecciona un bloque para editar sus propiedades.</p>
      </div>
    );
  }

  const handleContentChange = (key: string, value: unknown) => {
    onUpdate(block.id, { content: { ...(block.content as Record<string, unknown>), [key]: value } });
  };

  const handleStyleChange = (key: string, value: any) => {
    onUpdate(block.id, { style: { ...block.style, [key]: value } });
  };

  const toggleImageModal = (checked: boolean) => {
    const c = block.content as Record<string, unknown>;
    onUpdate(block.id, {
      content: { ...c, modalEnabled: checked },
      areas: checked ? { ...(block.areas || {}), modal: block.areas?.modal || [] } : block.areas,
    });
  };

  const addListItem = () => {
    const c = block.content as Record<string, unknown>;
    const items = (c.items as {id:string;title:string}[] | undefined) || [];
    const newItemId = `item-${genId()}`;
    const newItems = [...items, { id: newItemId, title: 'Nuevo Item', content: '' }];
    const emptyTextBlock = { id: genId(), type: BlockType.TEXT, content: { text: '' }, style: { textAlign: 'left', padding: '0px' } };
    onUpdate(block.id, {
      content: { ...c, items: newItems },
      areas: { ...(block.areas || {}), [newItemId]: [emptyTextBlock] }
    });
  };

  const updateListItem = (index: number, field: string, value: string) => {
    const c = block.content as Record<string, unknown>;
    const items = [...((c.items as {id:string;title:string;content?:string}[] | undefined) || [])];
    items[index] = { ...items[index], [field]: value };
    onUpdate(block.id, { content: { ...c, items } });
  };

  const removeListItem = (index: number) => {
    const c = block.content as Record<string, unknown>;
    const items = [...((c.items as {id:string}[] | undefined) || [])];
    const removedItem = items[index];
    items.splice(index, 1);
    const newAreas = { ...(block.areas || {}) };
    if (removedItem?.id) delete newAreas[removedItem.id];
    onUpdate(block.id, { content: { ...c, items }, areas: newAreas });
  };

  const addQuizOption = () => {
    const opts = ((block.content as Record<string, unknown>).options as {id:string;label:string;value:string}[] | undefined) || [];
    const newLetter = String.fromCharCode(65 + Math.min(opts.length, 25));
    const newOption = { id: `opt-${genId()}`, label: `${newLetter}. Nueva opción`, value: newLetter };
    handleContentChange('options', [...opts, newOption]);
  };

  const updateQuizOption = (index: number, val: string) => {
    const opts = [...(((block.content as Record<string, unknown>).options as {id:string;label:string;value:string}[] | undefined) || [])];
    opts[index] = { ...opts[index], label: val };
    handleContentChange('options', opts);
  };

  const removeQuizOption = (index: number) => {
    const opts = [...(((block.content as Record<string, unknown>).options as {id:string;label:string;value:string}[] | undefined) || [])];
    opts.splice(index, 1);
    handleContentChange('options', opts);
  };

  return (
    <div ref={scrollRef} className={`h-full overflow-y-auto custom-scrollbar ${darkMode ? 'panel-dark' : ''}`}>
      {/* Header — antes siempre usaba --color-surface-light y --color-text-primary (claros)
          sin importar darkMode, quedando blanca con texto oscuro dentro del panel oscuro. */}
      <div className="px-4 py-3.5 sticky top-0 z-10"
        style={{ background: darkMode ? 'var(--color-sidebar)' : 'var(--color-surface-light)', borderBottom: '1px solid color-mix(in srgb, var(--color-accent) 10%, transparent)' }}>
        <div className="flex items-center gap-2.5">
          <div className="px-2 py-0.5 rounded-[7px]"
            style={{ background: 'var(--color-sidebar)', boxShadow: 'var(--neu-dark-out)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-active)' }}>
              {TYPE_NAMES[block.type] || block.type.replace(/_/g, ' ')}
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: darkMode ? 'var(--color-text-active)' : 'var(--color-text-primary)' }}>Propiedades</span>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* LAYOUT */}
        {block.type === BlockType.LAYOUT && (
          <div className="p-4 rounded-xl text-sm space-y-2"
            style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-hover)', boxShadow: 'var(--neu-light-in)' }}>
            <p className="font-bold flex items-center gap-2"><Layout size={15}/> Bloque de columnas</p>
            <p className="opacity-80">Arrastra componentes desde la biblioteca directamente a cada columna en el canvas.</p>
            <p className="text-xs opacity-60">Para cambiar el número de columnas, elimina este bloque e inserta uno nuevo con la estructura deseada.</p>
          </div>
        )}

        {/* SABER_COLUMNS */}
        {block.type === BlockType.SABER_COLUMNS && (
          <div className="p-4 rounded-xl text-sm space-y-2"
            style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-hover)', boxShadow: 'var(--neu-light-in)' }}>
            <p className="font-bold flex items-center gap-2"><Layout size={15}/> Columnas Saber / Hacer</p>
            <p className="opacity-80">Arrastra bloques directamente a la columna <strong>Saber</strong> o <strong>Hacer</strong> en el canvas.</p>
          </div>
        )}

        {/* DIVIDER */}
        {block.type === BlockType.DIVIDER && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Estilo de línea</label>
                <select value={block.content.dividerStyle || 'solid'} onChange={e => handleContentChange('dividerStyle', e.target.value)} className="neu-input cursor-pointer">
                  <option value="solid">Sólido</option>
                  <option value="dashed">Guiones</option>
                  <option value="dotted">Puntos</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color</label>
                <select value={block.content.dividerColor || 'gray'} onChange={e => handleContentChange('dividerColor', e.target.value)} className="neu-input cursor-pointer">
                  <option value="gray">Gris</option>
                  <option value="dark">Oscuro</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="purple">Purple (Morado)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Etiqueta central (opcional)</label>
              <input type="text" value={block.content.dividerLabel || ''} onChange={e => handleContentChange('dividerLabel', e.target.value)} className="neu-input" placeholder="ej: o  ·  §  ···"/>
            </div>
          </div>
        )}

        {/* --- HEADING --- */}
        {block.type === BlockType.HEADING && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del Título</label>
              <div className="relative">
                <input type="text" value={block.content.text || ''} onChange={(e) => handleContentChange('text', e.target.value)} className="neu-input"/>
                <Type className="absolute right-3 top-2.5 text-gray-400" size={18}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Nivel</label>
                <select value={block.content.level || 'h2'} onChange={(e) => handleContentChange('level', e.target.value)} className="neu-input cursor-pointer">
                  <option value="h1">H1 (Principal)</option>
                  <option value="h2">H2 (Sección)</option>
                  <option value="h3">H3 (Subtítulo)</option>
                  <option value="h4">H4 (Detalle)</option>
                  <option value="h5">H5 (Pequeño)</option>
                </select>
              </div>
<div>
  <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Alineación del texto</label>
  <div className="flex gap-2">
    <button onClick={() => handleStyleChange('textAlign', 'left')}
      className={`neu-btn-group-item ${!block.style.textAlign || block.style.textAlign === 'left' ? 'is-active' : ''}`}>
      Izquierda
    </button>
    <button onClick={() => handleStyleChange('textAlign', 'center')}
      className={`neu-btn-group-item ${block.style.textAlign === 'center' ? 'is-active' : ''}`}>
      Centro
    </button>
    <button onClick={() => handleStyleChange('textAlign', 'right')}
      className={`neu-btn-group-item ${block.style.textAlign === 'right' ? 'is-active' : ''}`}>
      Derecha
    </button>
  </div>
</div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color / Estilo <ColorDot color={block.content.colorClass || ''}/></label>
              <select value={block.content.colorClass || ''} onChange={(e) => handleContentChange('colorClass', e.target.value)} className="neu-input cursor-pointer">
                <option value="">Por defecto (Negro/Gris)</option>
                <optgroup label="Colores Institucionales">
                  <option value="text-primary">Primary (Azul Oscuro)</option>
                  <option value="text-info">Info (Cyan)</option>
                  <option value="text-purple">Purple (Morado PB)</option>
                  <option value="text-orange">Orange (Naranja PB)</option>
                </optgroup>
                <optgroup label="Estado">
                  <option value="text-success">Success (Verde)</option>
                  <option value="text-warning">Warning (Amarillo)</option>
                  <option value="text-danger">Danger (Rojo)</option>
                </optgroup>
                <optgroup label="Fondos (Badge)">
                  <option value="bg-primary">Fondo Azul</option>
                  <option value="bg-info">Fondo Cyan</option>
                  <option value="bg-purple">Fondo Morado</option>
                  <option value="bg-orange">Fondo Naranja</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Peso de fuente</label>
              <select value={block.content.fontWeight || 'bold'} onChange={e => handleContentChange('fontWeight', e.target.value)} className="neu-input cursor-pointer">
                <option value="bold">Negrita</option>
                <option value="semibold">Semi-negrita</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="showDivider" checked={block.content.showDivider === true} onChange={e => handleContentChange('showDivider', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="showDivider" className="text-sm cursor-pointer select-none">Mostrar línea decorativa bajo el título</label>
            </div>
          </div>
        )}

        {/* --- TEXT --- */}
        {block.type === BlockType.TEXT && (
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Contenido</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <RichTextEditor value={block.content.text || ''} onChange={(val) => handleContentChange('text', val)} rows={12} placeholder="Escribe tu contenido aquí..."/>
            </div>
          </div>
        )}

        {/* --- QUIZ --- */}
        {block.type === BlockType.QUIZ && (
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Enunciado de la Pregunta</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <RichTextEditor value={block.content.question || ''} onChange={(val) => handleContentChange('question', val)} rows={4} placeholder="Escribe la pregunta..."/>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Opciones de Respuesta</label>
                <button onClick={addQuizOption} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={12}/> Agregar Opción</button>
              </div>
              <div className="space-y-4">
                {block.content.options?.map((opt: any, idx: number) => (
                  <div key={opt.id || idx} className="flex flex-col gap-2 p-3 border border-gray-200 bg-white rounded-lg shadow-sm relative group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input type="radio" name="correct-option" checked={block.content.correctValue === opt.value} onChange={() => handleContentChange('correctValue', opt.value)} className="cursor-pointer w-4 h-4 text-blue-600" title="Marcar como correcta"/>
                        <span className={`text-xs font-bold ${block.content.correctValue === opt.value ? 'text-green-600' : 'text-gray-500'}`}>{block.content.correctValue === opt.value ? 'RESPUESTA CORRECTA' : 'Opción ' + opt.value}</span>
                      </div>
                      <button onClick={() => removeQuizOption(idx)} title="Eliminar opción" aria-label="Eliminar opción" className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                    </div>
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <RichTextEditor value={opt.label} onChange={(val) => updateQuizOption(idx, val)} rows={2} placeholder="Opción de respuesta..."/>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">* Selecciona el círculo para marcar cuál es la respuesta correcta.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-green-700 mb-2">Retroalimentación Positiva (Correcto)</label>
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <RichTextEditor value={block.content.feedbackPositive || ''} onChange={(val) => handleContentChange('feedbackPositive', val)} rows={4} placeholder="Retroalimentación para respuesta correcta..."/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-red-700 mb-2">Retroalimentación Negativa (Incorrecto)</label>
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <RichTextEditor value={block.content.feedbackNegative || ''} onChange={(val) => handleContentChange('feedbackNegative', val)} rows={4} placeholder="Retroalimentación para respuesta incorrecta..."/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Botón Enviar</label>
                <input type="text" value={block.content.submitText || 'Enviar'} onChange={(e) => handleContentChange('submitText', e.target.value)} className="neu-input"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Label Correcto</label>
                <input type="text" value={block.content.correctLabel || '¡Correcto!'} onChange={(e) => handleContentChange('correctLabel', e.target.value)} className="neu-input"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Label Incorrecto</label>
                <input type="text" value={block.content.incorrectLabel || 'Respuesta incorrecta.'} onChange={(e) => handleContentChange('incorrectLabel', e.target.value)} className="neu-input"/>
              </div>
            </div>
          </div>
        )}

        {/* --- IMAGE --- */}
        {block.type === BlockType.IMAGE && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL de la Imagen</label>
              <input type="text" value={block.content.src || ''} onChange={(e) => handleContentChange('src', e.target.value)} className="neu-input" placeholder="https://..."/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto Alternativo (Alt)</label>
              <input type="text" value={block.content.alt || ''} onChange={(e) => handleContentChange('alt', e.target.value)} className="neu-input"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Pie de Foto (Opcional)</label>
              <input type="text" value={block.content.caption || ''} onChange={(e) => handleContentChange('caption', e.target.value)} className="neu-input"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Alineación</label>
                <select value={block.style.textAlign || 'center'} onChange={(e) => handleStyleChange('textAlign', e.target.value)} className="neu-input cursor-pointer">
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Estilo</label>
                <select value={block.content.imageStyle || 'rounded'} onChange={(e) => handleContentChange('imageStyle', e.target.value)} className="neu-input cursor-pointer">
                  <option value="normal">Normal</option>
                  <option value="rounded">Redondeado</option>
                  <option value="circle">Circular</option>
                  <option value="thumbnail">Miniatura (borde)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Ancho (opcional)</label>
                <input type="text" value={block.content.width || ''} onChange={(e) => handleContentChange('width', e.target.value)} className="neu-input" placeholder="ej: 100%, 300px"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Alto (opcional)</label>
                <input type="text" value={block.content.height || ''} onChange={(e) => handleContentChange('height', e.target.value)} className="neu-input" placeholder="ej: auto, 200px"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${block.content.modalEnabled ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-blue-50 border-blue-100'}`}>
                <input type="checkbox" id="lightbox" checked={block.content.lightbox === true} disabled={block.content.modalEnabled === true} onChange={(e) => handleContentChange('lightbox', e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300"/>
                <label htmlFor="lightbox" className="text-sm font-medium text-gray-700 cursor-pointer">Lightbox (Zoom)</label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input type="checkbox" id="showShadow" checked={block.content.showShadow !== false} onChange={(e) => handleContentChange('showShadow', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
                <label htmlFor="showShadow" className="text-sm cursor-pointer select-none">Mostrar sombra</label>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="imgModalEnabled" checked={block.content.modalEnabled === true} onChange={(e) => toggleImageModal(e.target.checked)} className="w-5 h-5 text-purple-600 rounded border-gray-300"/>
                <label htmlFor="imgModalEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">Abrir modal al hacer clic</label>
              </div>
              {block.content.modalEnabled && (
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título del Modal</label>
                  <input type="text" value={block.content.modalTitle || ''} onChange={(e) => handleContentChange('modalTitle', e.target.value)} className="neu-input" placeholder="Título de la ventana"/>
                  <p className="text-xs text-gray-500 mt-1.5">Arrastra bloques (incluso columnas) al área "Contenido del Modal" en el lienzo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIDEO --- */}
        {block.type === BlockType.VIDEO && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL del Video (YouTube)</label>
              <input type="text" value={block.content.url || ''} onChange={(e) => handleContentChange('url', e.target.value)} className="neu-input" placeholder="https://www.youtube.com/watch?v=..."/>
              <p className="text-xs text-gray-500 mt-1">Soporta enlaces directos, embed y short URLs de YouTube.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Relación de Aspecto</label>
              <select value={block.content.ratio || '16:9'} onChange={(e) => handleContentChange('ratio', e.target.value)} className="neu-input cursor-pointer">
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="4:3">4:3 (Clásico)</option>
                <option value="1:1">1:1 (Cuadrado)</option>
              </select>
            </div>
          </div>
        )}

        {/* --- TABLE --- */}
        {block.type === BlockType.TABLE && (
          <div className="space-y-3">
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-cyan-800">
              <p className="font-bold mb-1">Editor visual de tabla</p>
              <p>Clic para seleccionar celda · Doble clic para editar texto · Los estilos Moodle se aplican al exportar.</p>
            </div>
            <TableEditor value={block.content.text || ''} onChange={(html) => handleContentChange('text', html)}/>
          </div>
        )}

        {/* --- ALERT ---
            ✅ CAMBIO: Se eliminó RichTextEditor. El contenido se edita en el área del canvas. */}
        {block.type === BlockType.ALERT && (
          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>
                Color Temático <ColorDot color={block.content.type || 'info'}/>
              </label>
              <select value={block.content.type || 'info'} onChange={(e) => handleContentChange('type', e.target.value)} className="neu-input cursor-pointer">
                <option value="info">Info (Cyan)</option>
                <option value="blue">Primary (Azul)</option>
                <option value="success">Success (Verde)</option>
                <option value="yellow">Amarillo</option>
                <option value="secondary">Secondary (Gris)</option>
                <option value="purple">Purple (Morado)</option>
                <option value="orange">Orange (Naranja)</option>
              </select>
            </div>
            <AreaHint label="Contenido" />
          </div>
        )}

        {/* --- CONCLUSION ---
            ✅ CAMBIO: Se eliminó RichTextEditor. */}
        {block.type === BlockType.CONCLUSION && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título del Contenedor</label>
              <input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input font-bold"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Estilo</label>
                <select value={block.content.style || 'border'} onChange={(e) => handleContentChange('style', e.target.value)} className="neu-input cursor-pointer">
                  <option value="border">Borde Colorido</option>
                  <option value="filled">Relleno Sólido</option>
                  <option value="filled_light">Relleno Suave</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color</label>
                <select value={block.content.color || 'info'} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                  <option value="info">Info (Cyan)</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="yellow">Warning (Amarillo)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="secondary">Secondary (Gris)</option>
                  <option value="light">Light (Blanco/Gris)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del título</label>
              <select value={block.content.titleSize || 'h5'} onChange={e => handleContentChange('titleSize', e.target.value)} className="neu-input cursor-pointer">
                <option value="h4">H4 (Grande)</option>
                <option value="h5">H5 (Normal)</option>
                <option value="h6">H6 (Pequeño)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="showTitle" checked={block.content.showTitle !== false} onChange={e => handleContentChange('showTitle', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="showTitle" className="text-sm cursor-pointer select-none">Mostrar título del contenedor</label>
            </div>
            <AreaHint label="Contenido" />
          </div>
        )}

        {/* --- TASK ---
            ✅ CAMBIO: Se eliminaron los dos RichTextEditor (itinerario y evaluación). */}
        {block.type === BlockType.TASK && (
          <div className="space-y-5">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-sm font-bold text-blue-800 mb-2">Modalidad de Entrega</label>
              <select value={block.content.groupMode || 'individual'} onChange={(e) => handleContentChange('groupMode', e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="none">Ninguno (sin etiqueta)</option>
                <option value="individual">Individual</option>
                <option value="group">Grupal</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color Itinerario</label>
                <select value={block.content.itineraryColor || 'info'} onChange={(e) => handleContentChange('itineraryColor', e.target.value)} className="neu-input cursor-pointer">
                  <option value="info">Info (Cyan)</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color Evaluación</label>
                <select value={block.content.evaluationColor || 'primary'} onChange={(e) => handleContentChange('evaluationColor', e.target.value)} className="neu-input cursor-pointer">
                  <option value="primary">Primary (Azul)</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título sección itinerario</label>
                <input type="text" value={block.content.itineraryTitle || ''} onChange={e => handleContentChange('itineraryTitle', e.target.value)} className="neu-input" placeholder="Itinerario o Ruta de Desarrollo"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título sección evaluación</label>
                <input type="text" value={block.content.evaluationTitle || ''} onChange={e => handleContentChange('evaluationTitle', e.target.value)} className="neu-input" placeholder="Técnica / Instrumento de Evaluación"/>
              </div>
            </div>
            <AreaHint label="Itinerario / Ruta de Desarrollo" />
            <AreaHint label="Técnica / Instrumento de Evaluación" />
          </div>
        )}

        {/* --- PODCAST --- */}
        {block.type === BlockType.PODCAST && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título del Pódcast</label>
              <input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input"/>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Etiqueta (Ej: Audio)</label>
                <input type="text" value={block.content.customLabel || 'Pódcast'} onChange={(e) => handleContentChange('customLabel', e.target.value)} className="neu-input"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Número</label>
                <input type="text" value={block.content.number || ''} onChange={(e) => handleContentChange('number', e.target.value)} className="neu-input" placeholder="1"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Tema</label>
                <select value={block.content.color || 'info'} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                  <option value="info">Info (Cyan)</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="warning">Warning (Amarillo)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="orange">Orange (Naranja)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Icono</label>
              <select value={block.content.icon || 'fa-headphones'} onChange={(e) => handleContentChange('icon', e.target.value)} className="neu-input cursor-pointer">
                <option value="fa-headphones">Auriculares</option>
                <option value="fa-podcast">Pódcast</option>
                <option value="fa-microphone">Micrófono</option>
                <option value="fa-microphone-alt">Micrófono de mano</option>
                <option value="fa-volume-up">Volumen</option>
                <option value="fa-music">Música</option>
                <option value="fa-broadcast-tower">Emisora</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL del Audio (mp3)</label>
              <input type="text" value={block.content.url || ''} onChange={(e) => handleContentChange('url', e.target.value)} className="neu-input" placeholder="https://..."/>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="podBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="podBorder" className="text-sm cursor-pointer select-none">Mostrar borde</label>
            </div>
          </div>
        )}

        {/* --- CITATION ---
            ✅ CAMBIO: Se eliminó RichTextEditor. El texto se edita en el área del canvas. */}
        {block.type === BlockType.CITATION && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Distribución</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => onUpdate(block.id, { content: { ...block.content, layout: 'horizontal', iconPosition: 'left' } })}
                  className={`neu-btn-group-item ${block.content.layout !== 'vertical' && block.content.iconPosition !== 'right' ? 'is-active' : ''}`}
                ><div className="text-base mb-0.5">← Izq</div><div className="text-[10px] opacity-75">Icono izquierda</div></button>
                <button onClick={() => onUpdate(block.id, { content: { ...block.content, layout: 'horizontal', iconPosition: 'right' } })}
                  className={`neu-btn-group-item ${block.content.layout !== 'vertical' && block.content.iconPosition === 'right' ? 'is-active' : ''}`}
                ><div className="text-base mb-0.5">Der →</div><div className="text-[10px] opacity-75">Icono derecha</div></button>
                <button onClick={() => onUpdate(block.id, { content: { ...block.content, layout: 'vertical', iconPosition: 'left' } })}
                  className={`neu-btn-group-item ${block.content.layout === 'vertical' ? 'is-active' : ''}`}
                ><div className="text-base mb-0.5">↑ Arr</div><div className="text-[10px] opacity-75">Icono arriba</div></button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL del Icono / Imagen</label>
              <input type="text" value={block.content.iconUrl || ''} onChange={(e) => handleContentChange('iconUrl', e.target.value)} className="neu-input" placeholder="https://..."/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del Icono</label>
              <div className="grid grid-cols-4 gap-2">
                {[{ value: 'sm', label: 'XS', desc: '48px' }, { value: 'md', label: 'M', desc: '96px' }, { value: 'lg', label: 'L', desc: '144px' }, { value: 'xl', label: 'XL', desc: '192px' }].map(sz => (
                  <button key={sz.value} onClick={() => handleContentChange('iconSize', sz.value)}
                    className={`neu-btn-group-item ${block.content.iconSize === sz.value || (!block.content.iconSize && sz.value === 'md') ? 'is-active' : ''}`}
                  ><div className="font-black">{sz.label}</div><div className="text-[10px] opacity-75">{sz.desc}</div></button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título</label>
              <input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input font-bold"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Título</label>
                <select value={block.content.titleColor || 'text-info'} onChange={(e) => handleContentChange('titleColor', e.target.value)} className="neu-input cursor-pointer">
                  <option value="text-primary">Primary (Azul)</option>
                  <option value="text-info">Info (Cyan)</option>
                  <option value="text-success">Success (Verde)</option>
                  <option value="text-danger">Danger (Rojo)</option>
                  <option value="text-purple">Purple (Morado)</option>
                  <option value="text-orange">Orange (Naranja)</option>
                  <option value="text-dark">Oscuro</option>
                  <option value="text-white">Blanco</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del Título</label>
                <select value={block.content.titleSize || 'h5'} onChange={(e) => handleContentChange('titleSize', e.target.value)} className="neu-input cursor-pointer">
                  <option value="h3">H3 — Grande</option>
                  <option value="h4">H4 — Mediano</option>
                  <option value="h5">H5 — Normal</option>
                  <option value="h6">H6 — Pequeño</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color de Fondo</label>
              <select value={block.content.bgColor || 'none'} onChange={(e) => handleContentChange('bgColor', e.target.value)} className="neu-input cursor-pointer">
                <option value="none">Por defecto (Gris claro)</option>
                <option value="white">Blanco</option>
                <option value="primary">Primary (Azul suave)</option>
                <option value="info">Info (Cyan suave)</option>
                <option value="success">Success (Verde suave)</option>
                <option value="yellow">Warning (Amarillo suave)</option>
                <option value="danger">Danger (Rojo suave)</option>
                <option value="purple">Purple (Morado suave)</option>
                <option value="orange">Orange (Naranja suave)</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
            <AreaHint label="Contenido del texto" />
          </div>
        )}

        {/* --- FORUM / QUESTIONNAIRE ---
            ✅ CAMBIO: Se eliminó RichTextEditor. */}
        {(block.type === BlockType.FORUM || block.type === BlockType.QUESTIONNAIRE) && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título</label>
              <input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input"/>
            </div>
            {block.type === BlockType.FORUM && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-bold text-blue-800 mb-2">Modalidad de Entrega</label>
                <select value={block.content.groupMode || 'none'} onChange={(e) => handleContentChange('groupMode', e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">Ninguno (sin etiqueta)</option>
                  <option value="individual">Individual</option>
                  <option value="group">Grupal</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Tema</label>
              <select value={block.content.color || (block.type === BlockType.QUESTIONNAIRE ? 'purple' : 'primary')} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                <option value="primary">Primary (Azul)</option>
                <option value="info">Info (Cyan)</option>
                <option value="success">Success (Verde)</option>
                <option value="purple">Purple (Morado)</option>
                <option value="orange">Orange (Naranja)</option>
                <option value="danger">Danger (Rojo)</option>
                <option value="secondary">Secondary (Gris)</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="fqBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="fqBorder" className="text-sm cursor-pointer select-none">Mostrar borde de la tarjeta</label>
            </div>
            <AreaHint label="Instrucciones / Descripción" />
          </div>
        )}

        {/* --- BUTTON --- */}
        {block.type === BlockType.BUTTON && (
          <div className="space-y-5">
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del Botón</label><input type="text" value={block.content.text || ''} onChange={(e) => handleContentChange('text', e.target.value)} className="neu-input"/></div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL de Destino</label><input type="text" value={block.content.url || ''} onChange={(e) => handleContentChange('url', e.target.value)} className="neu-input"/></div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tipo</label><select value={block.content.variant || 'primary'} onChange={(e) => handleContentChange('variant', e.target.value)} className="neu-input cursor-pointer"><option value="primary">Libros</option><option value="info">Tareas</option><option value="success">Foros</option><option value="warning">Cuestionarios</option><option value="danger">Modales</option><option value="dark">Recursos interactivos</option><option value="orange">Orange</option><option value="light">Más info</option><option value="secondary">Enlaces externos</option></select></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.isFullWidth !== false} onChange={(e) => handleContentChange('isFullWidth', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Ancho Completo (100%)</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.isBold !== false} onChange={(e) => handleContentChange('isBold', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Texto en negrita</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.isSolid === true} onChange={(e) => handleContentChange('isSolid', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Relleno sólido (quita <code>outline</code>)</label></div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Badge / Distintivo</label>
                <select value={block.content.badgeType || 'none'} onChange={e => handleContentChange('badgeType', e.target.value)} className="neu-input cursor-pointer">
                  <option value="none">Sin badge</option>
                  <option value="pill">Píldora (esquina)</option>
                  <option value="inline">En línea (junto al texto)</option>
                  <option value="dot">Punto (esquina)</option>
                </select>
              </div>
              {block.content.badgeType && block.content.badgeType !== 'none' && (
                <>
                  {block.content.badgeType !== 'dot' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del badge</label>
                      <input type="text" value={block.content.badgeText || ''} onChange={e => handleContentChange('badgeText', e.target.value)} className="neu-input" placeholder="ej: 99+, Nuevo"/>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del badge</label>
                    <select value={block.content.badgeColor || 'danger'} onChange={e => handleContentChange('badgeColor', e.target.value)} className="neu-input cursor-pointer">
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="success">Success</option>
                      <option value="danger">Danger</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="btnModalEnabled" checked={block.content.modalEnabled === true} onChange={(e) => toggleImageModal(e.target.checked)} className="w-5 h-5 text-purple-600 rounded border-gray-300"/>
                <label htmlFor="btnModalEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">Abrir modal al hacer clic</label>
              </div>
              {block.content.modalEnabled && (
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título del Modal</label>
                  <input type="text" value={block.content.modalTitle || ''} onChange={(e) => handleContentChange('modalTitle', e.target.value)} className="neu-input" placeholder="Título de la ventana"/>
                  <p className="text-xs text-gray-500 mt-1.5">Arrastra bloques (incluso columnas) al área "Contenido del Modal" en el lienzo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ICON_CARD --- */}
        {block.type === BlockType.ICON_CARD && (
          <div className="space-y-5">
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título de la Tarjeta</label><input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input"/></div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Tema</label>
              <select value={block.content.color || 'primary'} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                <option value="primary">Primary (Azul)</option><option value="info">Info (Cyan)</option><option value="success">Success (Verde)</option><option value="warning">Warning (Amarillo)</option><option value="danger">Danger (Rojo)</option><option value="purple">Purple (Morado)</option><option value="orange">Orange (Naranja)</option>
              </select>
            </div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Icono</label><IconPicker value={block.content.icon || 'fa-lightbulb'} onChange={(ic) => handleContentChange('icon', ic)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Posición del icono</label>
                <select value={block.content.iconPosition || 'left'} onChange={e => handleContentChange('iconPosition', e.target.value)} className="neu-input cursor-pointer">
                  <option value="left">Izquierda</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del icono</label>
                <select value={block.content.iconSize || 'md'} onChange={e => handleContentChange('iconSize', e.target.value)} className="neu-input cursor-pointer">
                  <option value="sm">Pequeño (32px)</option>
                  <option value="md">Mediano (48px)</option>
                  <option value="lg">Grande (64px)</option>
                </select>
              </div>
            </div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto</label><RichTextEditor value={block.content.text || ''} onChange={(val) => handleContentChange('text', val)} rows={4}/></div>
          </div>
        )}

        {/* --- FLIPCARD --- */}
        {block.type === BlockType.FLIPCARD && (
          <div className="space-y-5">
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL Imagen Frente</label><input type="text" value={block.content.frontImage || ''} onChange={(e) => handleContentChange('frontImage', e.target.value)} className="neu-input"/></div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL Imagen Reverso</label><input type="text" value={block.content.backImage || ''} onChange={(e) => handleContentChange('backImage', e.target.value)} className="neu-input"/></div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Proporción de la tarjeta</label>
              <select value={block.content.aspectRatio || '877/565'} onChange={e => handleContentChange('aspectRatio', e.target.value)} className="neu-input cursor-pointer">
                <option value="877/565">Original (877:565)</option>
                <option value="16/9">16:9 Widescreen</option>
                <option value="4/3">4:3 Clásico</option>
                <option value="1/1">1:1 Cuadrado</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="flipHint" checked={block.content.showFlipHint !== false} onChange={(e) => handleContentChange('showFlipHint', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="flipHint" className="text-sm cursor-pointer select-none">Mostrar indicador "Clic para voltear"</label>
            </div>
          </div>
        )}

        {/* --- MODAL --- */}
        {block.type === BlockType.MODAL && (
          <div className="space-y-5">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 flex items-start gap-2">
              <Lightbulb size={16} className="shrink-0 mt-0.5"/>
              <span>El <strong>disparador</strong> abre una ventana emergente. Su contenido se arma arrastrando bloques al área <strong>Contenido de la ventana</strong> en el lienzo.</span>
            </div>

            <div className="border-b pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Disparador</div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del Disparador</label><input type="text" value={block.content.triggerText || ''} onChange={(e) => handleContentChange('triggerText', e.target.value)} className="neu-input"/></div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tipo de Disparador</label><select value={block.content.triggerType || 'button'} onChange={(e) => handleContentChange('triggerType', e.target.value)} className="neu-input cursor-pointer"><option value="button">Botón</option><option value="text">Enlace de Texto</option><option value="badge">Etiqueta (Badge)</option></select></div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color</label>
              <select value={block.content.variant || 'primary'} onChange={(e) => handleContentChange('variant', e.target.value)} className="neu-input cursor-pointer">
                <option value="primary">Primary (Azul)</option><option value="info">Info (Cyan)</option><option value="success">Success (Verde)</option><option value="warning">Warning (Morado/Violeta)</option><option value="danger">Danger (Rojo)</option><option value="orange">Orange (Naranja)</option><option value="secondary">Secondary (Gris)</option>
              </select>
            </div>
            {(block.content.triggerType || 'button') === 'button' && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.isSolid !== false} onChange={(e) => handleContentChange('isSolid', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Relleno sólido (desmarca para <code>outline</code>)</label></div>
            )}
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Posición</label><select value={block.content.align || 'center'} onChange={(e) => handleContentChange('align', e.target.value)} className="neu-input cursor-pointer"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></div>
            {(block.content.triggerType || 'button') === 'button' && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.isFullWidth === true} onChange={(e) => handleContentChange('isFullWidth', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Ancho completo (<code>w-100</code>)</label></div>
            )}

            <div className="border-b pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Ventana</div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título de la Ventana</label><input type="text" value={block.content.title || ''} onChange={(e) => handleContentChange('title', e.target.value)} className="neu-input"/></div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño</label><select value={block.content.size || 'md'} onChange={(e) => handleContentChange('size', e.target.value)} className="neu-input cursor-pointer"><option value="sm">Pequeño (sm)</option><option value="md">Mediano (md)</option><option value="lg">Grande (lg)</option><option value="xl">Extra grande (xl)</option><option value="fullscreen">Pantalla completa</option></select></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.centered === true} onChange={(e) => handleContentChange('centered', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Centrado verticalmente</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.scrollable === true} onChange={(e) => handleContentChange('scrollable', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Cuerpo con scroll interno</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.staticBackdrop === true} onChange={(e) => handleContentChange('staticBackdrop', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Fondo fijo (no cierra al clic fuera ni con <code>Esc</code>)</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.animation !== false} onChange={(e) => handleContentChange('animation', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Animación de entrada (fade)</label></div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"><input type="checkbox" checked={block.content.showFooter !== false} onChange={(e) => handleContentChange('showFooter', e.target.checked)} className="rounded text-blue-600"/><label className="text-sm">Pie con botón "Cerrar"</label></div>
          </div>
        )}

        {/* --- POPOVER --- */}
        {block.type === BlockType.POPOVER && (
          <div className="space-y-5">
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del Disparador (Botón/Link)</label><input type="text" value={block.content.triggerText || ''} onChange={(e) => handleContentChange('triggerText', e.target.value)} className="neu-input"/></div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Botón</label>
              <select value={block.content.variant || 'info'} onChange={(e) => handleContentChange('variant', e.target.value)} className="neu-input cursor-pointer">
                <option value="info">Info (Cyan)</option><option value="primary">Primary (Azul)</option><option value="success">Success (Verde)</option><option value="warning">Warning (Morado/Violeta)</option><option value="danger">Danger (Rojo)</option><option value="orange">Orange (Naranja)</option><option value="secondary">Secondary (Gris)</option>
              </select>
            </div>
            <div><label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Posición</label><select value={block.content.placement || 'top'} onChange={(e) => handleContentChange('placement', e.target.value)} className="neu-input cursor-pointer"><option value="top">Arriba</option><option value="right">Derecha</option><option value="bottom">Abajo</option><option value="left">Izquierda</option></select></div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Contenido Oculto</label>
              <textarea className="neu-input" style={{ minHeight: 96, resize: 'vertical' }} value={block.content.text || ''} onChange={(e) => handleContentChange('text', e.target.value)} />
            </div>
          </div>
        )}

        {/* --- ACCORDION / TABS ---
            ✅ CAMBIO: Se eliminó el rich text por sección. El contenido se edita en el canvas. */}
        {(block.type === BlockType.ACCORDION || block.type === BlockType.TABS) && (
          <div className="space-y-5">
            <AreaHint />
            <div className="flex justify-between items-center border-b pb-2">
              <label className="text-sm font-bold text-gray-700">
                {block.type === BlockType.ACCORDION ? 'Secciones' : 'Pestañas'}
              </label>
              <button onClick={addListItem} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"><Plus size={14}/> Añadir</button>
            </div>
            {block.type === BlockType.TABS && (
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Orientación de Pestañas</label>
                <div className="flex gap-2">
                  <button onClick={() => handleContentChange('orientation', 'horizontal')} className={`neu-btn-group-item ${block.content.orientation === 'horizontal' ? 'is-active' : ''}`}>Horizontal</button>
                  <button onClick={() => handleContentChange('orientation', 'vertical')} className={`neu-btn-group-item ${block.content.orientation === 'vertical' || !block.content.orientation ? 'is-active' : ''}`}>Vertical</button>
                </div>
              </div>
            )}
            {block.type === BlockType.ACCORDION ? (
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Tema</label>
                <select value={block.content.color || 'none'} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                  <option value="none">Sin color (por defecto)</option>
                  <option value="blue">Azul</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="dark">Dark (Petróleo)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="secondary">Secondary (Gris)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del Tema</label>
                <select value={block.content.color || 'none'} onChange={(e) => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
                  <option value="none">Sin color (por defecto)</option>
                  <option value="blue">Azul</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="purple">Purple (Morado)</option>
                  <option value="orange">Orange (Naranja)</option>
                  <option value="dark">Dark (Petróleo)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="secondary">Secondary (Gris)</option>
                </select>
              </div>
            )}
            {block.type === BlockType.ACCORDION && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input type="checkbox" id="accBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
                <label htmlFor="accBorder" className="text-sm cursor-pointer select-none">Mostrar borde del contenedor</label>
              </div>
            )}
            <div className="space-y-3">
              {block.content.items?.map((item: any, idx: number) => (
                <div key={item.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-2">
                  <input type="text" value={item.title} onChange={(e) => updateListItem(idx, 'title', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm font-medium focus:border-blue-500 outline-none"
                    placeholder="Título del item"/>
                  <button onClick={() => removeListItem(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded border border-gray-200 bg-white shrink-0" title="Eliminar" aria-label="Eliminar item">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
   {block.type === BlockType.TIMELINE && (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color de la línea</label>
        <select value={block.content.color || 'primary'} onChange={e => handleContentChange('color', e.target.value)} className="neu-input cursor-pointer">
          <option value="primary">Primary (Azul)</option><option value="info">Info (Cyan)</option><option value="success">Success (Verde)</option><option value="yellow">Amarillo</option><option value="danger">Danger (Rojo)</option><option value="purple">Purple (Morado)</option><option value="orange">Orange (Naranja)</option><option value="secondary">Secondary (Gris)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Alto imagen (px)</label>
        <input type="number" value={block.content.itemImageHeight || 160} min={80} max={400} onChange={e => handleContentChange('itemImageHeight', parseInt(e.target.value) || 160)} className="neu-input"/>
      </div>
    </div>
    <div className="flex justify-between items-center border-b pb-2">
      <label className="text-sm font-bold text-gray-700">Elementos</label>
      <button onClick={() => { const items = [...(block.content.items||[])]; const id = `tl-${genId()}`; items.push({id, title:'Nueva fase', date:'', text:'', imageUrl:''}); handleContentChange('items', items); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 flex items-center gap-1"><Plus size={14}/> Añadir</button>
    </div>
    {block.content.items?.map((item: any, idx: number) => (
      <div key={item.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2 relative group">
        <button onClick={() => { const items=[...(block.content.items||[])]; items.splice(idx,1); handleContentChange('items',items); }} title="Eliminar fase" aria-label="Eliminar fase" className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
        <input type="text" placeholder="Título de la fase" value={item.title} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],title:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"/>
        <input type="text" placeholder="Fecha / Año (opcional)" value={item.date||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],date:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"/>
        <textarea placeholder="Descripción" value={item.text||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],text:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none resize-none" rows={2}/>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">URL de imagen (opcional)</label>
          <input type="text" placeholder="https://... (dejar vacío para sin imagen)" value={item.imageUrl||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],imageUrl:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"/>
        </div>
      </div>
    ))}
  </div>
)}

        {/* ── STAT CARD ── */}
        {block.type === BlockType.STAT_CARD && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" id="statBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
              <label htmlFor="statBorder" className="text-sm cursor-pointer select-none">Mostrar borde y sombra en tarjetas</label>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <label className="text-sm font-bold text-gray-700">Estadísticas</label>
              <button onClick={() => { const items=[...(block.content.items||[])]; items.push({id:`st-${genId()}`,number:'0',label:'',icon:'fa-chart-bar',color:'info'}); handleContentChange('items',items); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 flex items-center gap-1"><Plus size={14}/> Añadir</button>
            </div>
            {block.content.items?.map((item: any, idx: number) => (
              <div key={item.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2 relative group">
                <button onClick={() => { const items=[...(block.content.items||[])]; items.splice(idx,1); handleContentChange('items',items); }} title="Eliminar estadística" aria-label="Eliminar estadística" className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                <input type="text" placeholder="Número / Valor (ej: 85%)" value={item.number||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],number:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold focus:border-blue-500 outline-none"/>
                <input type="text" placeholder="Etiqueta" value={item.label||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],label:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"/>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500 mb-1 block">Icono FA</label><input type="text" value={item.icon||'fa-chart-bar'} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],icon:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none" placeholder="fa-users"/></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Color</label><select value={item.color||'info'} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],color:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white outline-none"><option value="info">Cyan</option><option value="primary">Azul</option><option value="success">Verde</option><option value="warning">Amarillo</option><option value="danger">Rojo</option><option value="purple">Morado</option><option value="orange">Naranja</option></select></div>
                </div>
              </div>
            ))}
          </div>
        )}


{block.type === BlockType.CODE_BLOCK && (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Lenguaje</label>
      <select value={block.content.language || 'html'} onChange={e => handleContentChange('language', e.target.value)} className="neu-input cursor-pointer">
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="javascript">JavaScript</option>
        <option value="php">PHP</option>
        <option value="python">Python</option>
        <option value="sql">SQL</option>
        <option value="bash">Bash / Terminal</option>
        <option value="json">JSON</option>
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Nombre del archivo (opcional)</label>
      <input type="text" value={block.content.filename || ''} onChange={e => handleContentChange('filename', e.target.value)} className="neu-input" placeholder="index.html"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Código</label>
      <textarea
        value={block.content.code || ''}
        onChange={e => handleContentChange('code', e.target.value)}
        className="neu-input font-mono text-xs" style={{ resize: 'none' }}
        rows={14}
        placeholder="Escribe o pega tu código aquí..."
        spellCheck={false}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
        <input type="checkbox" id="showlines" checked={block.content.showLineNumbers !== false} onChange={e => handleContentChange('showLineNumbers', e.target.checked)} className="rounded text-blue-600"/>
        <label htmlFor="showlines" className="text-sm">Números de línea</label>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tema</label>
        <select value={block.content.theme || 'dark'} onChange={e => handleContentChange('theme', e.target.value)} className="neu-input cursor-pointer">
          <option value="dark">Oscuro</option>
          <option value="light">Claro</option>
        </select>
      </div>
    </div>
  </div>
)}


{block.type === BlockType.COLLAPSE_ICON && (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL del Icono / Imagen</label>
      <input type="text" value={block.content.iconUrl || ''} onChange={e => handleContentChange('iconUrl', e.target.value)} className="neu-input" placeholder="https://..."/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del Icono</label>
      <div className="grid grid-cols-4 gap-2">
        {[{value:'sm',label:'XS',desc:'60px'},{value:'md',label:'M',desc:'90px'},{value:'lg',label:'L',desc:'130px'},{value:'xl',label:'XL',desc:'180px'}].map(sz => (
          <button key={sz.value} onClick={() => handleContentChange('iconSize', sz.value)}
            className={`neu-btn-group-item ${block.content.iconSize === sz.value || (!block.content.iconSize && sz.value === 'md') ? 'is-active' : ''}`}>
            <div className="font-black">{sz.label}</div><div className="text-[10px] opacity-75">{sz.desc}</div>
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Posición del icono</label>
      <select value={block.content.iconPosition || 'left'} onChange={e => handleContentChange('iconPosition', e.target.value)} className="neu-input cursor-pointer">
        <option value="left">Izquierda</option>
        <option value="right">Derecha</option>
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Texto del disparador (junto al icono)</label>
      <input type="text" value={block.content.triggerText || ''} onChange={e => handleContentChange('triggerText', e.target.value)} className="neu-input" placeholder="Realicemos clic en el ícono para ver el contenido."/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del texto disparador</label>
      <select value={block.content.triggerColor || 'orange'} onChange={e => handleContentChange('triggerColor', e.target.value)} className="neu-input cursor-pointer">
        <option value="orange">Orange (Naranja)</option>
        <option value="info">Info (Cyan)</option>
        <option value="primary">Primary (Azul)</option>
        <option value="success">Success (Verde)</option>
        <option value="danger">Danger (Rojo)</option>
        <option value="purple">Purple (Morado)</option>
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título del contenido (opcional)</label>
      <input type="text" value={block.content.contentTitle || ''} onChange={e => handleContentChange('contentTitle', e.target.value)} className="neu-input" placeholder="Claves de lectura del infográfico"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del título</label>
      <select value={block.content.titleColor || 'text-info'} onChange={e => handleContentChange('titleColor', e.target.value)} className="neu-input cursor-pointer">
        <option value="text-info">Info (Cyan)</option>
        <option value="text-primary">Primary (Azul)</option>
        <option value="text-orange">Orange (Naranja)</option>
        <option value="text-success">Success (Verde)</option>
        <option value="text-danger">Danger (Rojo)</option>
        <option value="text-purple">Purple (Morado)</option>
        <option value="text-dark">Oscuro</option>
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Contenido (HTML)</label>
      <RichTextEditor value={block.content.contentText || ''} onChange={val => handleContentChange('contentText', val)} rows={6} placeholder="Escribe el contenido HTML..."/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color de fondo del contenedor</label>
      <select value={block.content.bgColor || 'white'} onChange={e => handleContentChange('bgColor', e.target.value)} className="neu-input cursor-pointer">
        <option value="white">Blanco</option>
        <option value="none">Gris claro (default)</option>
        <option value="info">Info claro (Cyan)</option>
        <option value="yellow">Amarillo claro</option>
        <option value="purple">Morado claro</option>
        <option value="orange">Naranja claro</option>
      </select>
    </div>
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
      <input type="checkbox" id="colBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
      <label htmlFor="colBorder" className="text-sm cursor-pointer select-none">Mostrar borde del contenedor</label>
    </div>
  </div>
)}

{block.type === BlockType.CARD_IMAGE && (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL de la imagen</label>
      <input type="text" value={block.content.imageUrl || ''} onChange={e => handleContentChange('imageUrl', e.target.value)}
        className="neu-input"
        placeholder="https://..."/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título (opcional)</label>
      <input type="text" value={block.content.title || ''} onChange={e => handleContentChange('title', e.target.value)}
        className="neu-input"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color del título</label>
      <select value={block.content.titleColor || 'text-primary'} onChange={e => handleContentChange('titleColor', e.target.value)}
        className="neu-input cursor-pointer">
        <option value="text-primary">Primary (Azul)</option>
        <option value="text-info">Info (Cyan)</option>
        <option value="text-orange">Orange (Naranja)</option>
        <option value="text-success">Success (Verde)</option>
        <option value="text-danger">Danger (Rojo)</option>
        <option value="text-purple">Purple (Morado)</option>
        <option value="text-dark">Oscuro</option>
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Alto de Imagen (px)</label>
      <input type="number" min={80} max={600} value={block.content.imageHeight || 220} onChange={e => handleContentChange('imageHeight', Number(e.target.value))} className="neu-input"/>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input type="checkbox" id="cardfw" checked={block.content.fullWidth === true}
          onChange={e => handleContentChange('fullWidth', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
        <label htmlFor="cardfw" className="text-sm cursor-pointer select-none">Ancho completo</label>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input type="checkbox" id="cardborder" checked={block.content.showBorder !== false}
          onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
        <label htmlFor="cardborder" className="text-sm cursor-pointer select-none">Borde y sombra</label>
      </div>
    </div>
    <AreaHint label="Contenido de la tarjeta" />
  </div>
)}

        {/* ── SECTION BANNER ── */}
     {block.type === BlockType.SECTION_BANNER && (
  <div className="space-y-4">
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Título</label>
      <input type="text" value={block.content.title || ''} onChange={e => handleContentChange('title', e.target.value)}
        className="neu-input"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Subtítulo (opcional)</label>
      <input type="text" value={block.content.subtitle || ''} onChange={e => handleContentChange('subtitle', e.target.value)}
        className="neu-input"
        placeholder="Descripción breve..."/>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Estilo</label>
        <select value={block.content.style || 'solid'} onChange={e => handleContentChange('style', e.target.value)}
          className="neu-input cursor-pointer">
          <option value="solid">Sólido</option>
          <option value="light">Suave con borde</option>
          <option value="outline">Solo contorno</option>
          <option value="gradient">Degradado suave</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color</label>
        <select value={block.content.color || 'primary'} onChange={e => handleContentChange('color', e.target.value)}
          className="neu-input cursor-pointer">
          <option value="primary">Primary (Azul)</option>
          <option value="info">Info (Cyan)</option>
          <option value="success">Success (Verde)</option>
          <option value="yellow">Amarillo</option>
          <option value="danger">Danger (Rojo)</option>
          <option value="purple">Purple (Morado)</option>
          <option value="orange">Orange (Naranja)</option>
          <option value="secondary">Secondary (Gris)</option>
        </select>
      </div>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Icono FontAwesome (opcional)</label>
      <IconPicker value={block.content.icon || ''} onChange={val => handleContentChange('icon', val)}/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del icono</label>
      <div className="flex gap-2">
        {[{v:'sm',l:'S — pequeño'},{v:'md',l:'M — normal'},{v:'lg',l:'L — grande'}].map(sz => (
          <button key={sz.v} onClick={() => handleContentChange('iconSize', sz.v)}
            className={`neu-btn-group-item ${(!block.content.iconSize && sz.v === 'md') || block.content.iconSize === sz.v ? 'is-active' : ''}`}>
            {sz.l}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

        {block.type === BlockType.BLOCKQUOTE && (
  <div className="space-y-4">
    {/* Estilo y tamaño */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Estilo visual</label>
        <select value={block.content.bqStyle || 'border'} onChange={e => handleContentChange('bqStyle', e.target.value)}
          className="neu-input cursor-pointer">
          <option value="border">Solo borde izquierdo</option>
          <option value="filled">Relleno suave + borde</option>
          <option value="card">Tarjeta con fondo</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Tamaño del texto</label>
        <select value={block.content.textSize || 'md'} onChange={e => handleContentChange('textSize', e.target.value)}
          className="neu-input cursor-pointer">
          <option value="sm">Pequeño</option>
          <option value="md">Normal</option>
          <option value="lg">Grande</option>
        </select>
      </div>
    </div>
    {/* Icono de comillas */}
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <input type="checkbox" id="showicon" checked={block.content.showIcon !== false}
        onChange={e => handleContentChange('showIcon', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
      <label htmlFor="showicon" className="text-sm cursor-pointer select-none">Mostrar icono de comillas</label>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Cita textual</label>
      <textarea value={block.content.text || ''} onChange={e => handleContentChange('text', e.target.value)}
        className="neu-input" style={{ resize: 'vertical', minHeight: 96 }}
        placeholder="Escribe la cita aquí..."/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Autor (opcional)</label>
      <input type="text" value={block.content.author || ''} onChange={e => handleContentChange('author', e.target.value)}
        className="neu-input"
        placeholder="Nombre Apellido"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Fuente / Año (opcional)</label>
      <input type="text" value={block.content.source || ''} onChange={e => handleContentChange('source', e.target.value)}
        className="neu-input"
        placeholder="Fuente o Año"/>
    </div>
    <div>
      <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Color de acento</label>
      <select value={block.content.color || 'info'} onChange={e => handleContentChange('color', e.target.value)}
        className="neu-input cursor-pointer">
        <option value="info">Info (Cyan)</option>
        <option value="primary">Primary (Azul)</option>
        <option value="success">Success (Verde)</option>
        <option value="yellow">Amarillo</option>
        <option value="danger">Danger (Rojo)</option>
        <option value="purple">Purple (Morado)</option>
        <option value="orange">Orange (Naranja)</option>
        <option value="secondary">Secondary (Gris)</option>
      </select>
    </div>
  </div>
)}

        {/* ── DOWNLOAD CARD ── */}
        {block.type === BlockType.DOWNLOAD_CARD && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input type="checkbox" id="dlBorder" checked={block.content.showBorder !== false} onChange={e => handleContentChange('showBorder', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
                <label htmlFor="dlBorder" className="text-sm cursor-pointer select-none">Mostrar borde</label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input type="checkbox" id="dlLabel" checked={block.content.showDownloadLabel === true} onChange={e => handleContentChange('showDownloadLabel', e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
                <label htmlFor="dlLabel" className="text-sm cursor-pointer select-none">Mostrar "Descargar"</label>
              </div>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <label className="text-sm font-bold text-gray-700">Archivos descargables</label>
              <button onClick={() => { const items=[...(block.content.items||[])]; items.push({id:`dl-${genId()}`,name:'Nuevo archivo.pdf',url:'#',type:'pdf',size:''}); handleContentChange('items',items); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 flex items-center gap-1"><Plus size={14}/> Añadir</button>
            </div>
            {block.content.items?.map((item: any, idx: number) => (
              <div key={item.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2 relative group">
                <button onClick={() => { const items=[...(block.content.items||[])]; items.splice(idx,1); handleContentChange('items',items); }} title="Eliminar archivo" aria-label="Eliminar archivo" className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                <input type="text" placeholder="Nombre del archivo" value={item.name||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],name:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"/>
                <input type="text" placeholder="URL de descarga" value={item.url||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],url:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none"/>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500 mb-1 block">Tipo</label><select value={item.type||'pdf'} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],type:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white outline-none"><option value="pdf">PDF</option><option value="word">Word</option><option value="excel">Excel</option><option value="powerpoint">PowerPoint</option><option value="image">Imagen</option><option value="audio">Audio</option><option value="video">Video</option><option value="zip">ZIP</option><option value="default">Otro</option></select></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Tamaño (opcional)</label><input type="text" value={item.size||''} onChange={e => { const items=[...(block.content.items||[])]; items[idx]={...items[idx],size:e.target.value}; handleContentChange('items',items); }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none" placeholder="2.4 MB"/></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INTRO CARD ── */}
        {block.type === BlockType.INTRO_CARD && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>URL de la imagen / icono</label>
              <input type="text" value={block.content.imageUrl || ''} onChange={e => handleContentChange('imageUrl', e.target.value)}
                className="neu-input"
                placeholder="https://..."/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Ancho de la imagen (px)</label>
              <input type="number" value={block.content.imageWidth || 140} min={40} max={300}
                onChange={e => handleContentChange('imageWidth', parseInt(e.target.value) || 140)}
                className="neu-input"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Columnas imagen (de 12)</label>
              <select value={block.content.imageCol || '2'} onChange={e => handleContentChange('imageCol', e.target.value)}
                className="neu-input cursor-pointer">
                <option value="1">1 col — muy pequeño</option>
                <option value="2">2 col — pequeño</option>
                <option value="3">3 col — mediano</option>
                <option value="4">4 col — grande</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>
                Color de fondo <ColorDot color={block.content.bgColor || 'info'}/>
              </label>
              <select value={block.content.bgColor || 'info'} onChange={e => handleContentChange('bgColor', e.target.value)}
                className="neu-input cursor-pointer">
                <option value="info">Info (Cyan suave)</option>
                <option value="primary">Primary (Azul suave)</option>
                <option value="success">Success (Verde suave)</option>
                <option value="warning">Warning (Amarillo suave)</option>
                <option value="danger">Danger (Rojo suave)</option>
                <option value="purple">Purple (Morado suave)</option>
                <option value="orange">Orange (Naranja suave)</option>
                <option value="secondary">Gris suave</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Posición de la imagen</label>
              <select value={block.content.imagePosition || 'left'} onChange={e => handleContentChange('imagePosition', e.target.value)} className="neu-input cursor-pointer">
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <AreaHint label="Contenido del texto" />
          </div>
        )}

      </div>
    </div>
  );
};