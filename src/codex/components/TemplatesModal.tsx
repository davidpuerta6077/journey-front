import React from 'react';
import { BlockData } from '../types';
import { BUILT_IN_TEMPLATES } from '../data/templates';
import { FolderOpen, ChevronRight, X } from 'lucide-react-codex';

interface TemplatesModalProps {
  show: boolean;
  onClose: () => void;
  onLoad: (blocks: BlockData[]) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ show, onClose, onLoad, onImport }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Plantillas prediseñadas">
      <div className="bg-white rounded-2xl shadow-2xl w-[780px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="text-blue-600" size={22}/> Plantillas Prediseñadas</h3>
            <p className="text-xs text-gray-400 mt-1">Selecciona una plantilla para cargarla en el canvas. También puedes <label className="text-blue-500 underline cursor-pointer">importar un JSON<input type="file" accept=".json" className="hidden" onChange={(e) => { onImport(e); onClose(); }}/></label>.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={22} className="text-gray-400"/></button>
        </div>
        <div className="overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {BUILT_IN_TEMPLATES.map((tpl, i) => (
            <div key={i} onClick={() => onLoad(tpl.blocks())} className="group border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all bg-white hover:bg-blue-50/30">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{tpl.emoji}</span>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm group-hover:text-blue-700">{tpl.name}</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">{tpl.description}</p></div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 mt-0.5 shrink-0"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
