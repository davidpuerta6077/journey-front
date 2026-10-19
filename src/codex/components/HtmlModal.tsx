import React, { useState, useEffect } from 'react';
import { X, Code, HelpCircle, FileJson, Copy, CheckCircle } from 'lucide-react-codex';

interface HtmlModalProps {
  show: boolean;
  onClose: () => void;
  initialHtml: string;
}

export const HtmlModal: React.FC<HtmlModalProps> = ({ show, onClose, initialHtml }) => {
  const [html, setHtml] = useState(initialHtml);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (show) { setHtml(initialHtml); setCopySuccess(false); }
  }, [show, initialHtml]);

  if (!show) return null;

  const handleFormat = () => {
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
        // Preserve inline spaces (e.g. ' ' between </strong> y <em>).
        // Skip only structural whitespace that contains newlines.
        if (token.trim() || !/[\n\r]/.test(token)) { result += token; lastWasBlock = false; }
      }
    });
    setHtml(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Código HTML generado">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Code className="text-blue-600"/> Código HTML para Moodle</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        <div className="p-6 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0 mt-1"><HelpCircle size={24}/></div>
            <div className="text-sm text-blue-900"><p className="font-bold mb-2 text-base">Instrucciones para Moodle:</p><ol className="list-decimal ml-5 space-y-1.5"><li>Haz clic en <strong>COPIAR CÓDIGO</strong>.</li><li>En Moodle, activa el modo de edición de código HTML (botón <strong>&lt; &gt;</strong>).</li><li>Pega el código generado.</li></ol></div>
          </div>
          <button onClick={handleFormat} className="ml-4 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm border border-blue-200 whitespace-nowrap"><FileJson size={16}/> Formatear Código</button>
        </div>
        <div className="flex-1 p-0 overflow-hidden flex flex-col relative group">
          <textarea readOnly value={html} className="w-full h-full p-6 font-mono text-xs bg-slate-800 text-slate-100 outline-none resize-none"/>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={handleCopy} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded backdrop-blur-sm"><Copy size={20}/></button></div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cerrar</button>
          <button onClick={handleCopy} className={`px-8 py-2.5 rounded-lg font-bold text-white flex items-center gap-2 transition-all shadow-lg ${copySuccess ? 'bg-green-600 transform scale-105' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}>{copySuccess ? <CheckCircle size={20}/> : <Copy size={20}/>} {copySuccess ? '¡Copiado!' : 'COPIAR CÓDIGO HTML'}</button>
        </div>
      </div>
    </div>
  );
};
