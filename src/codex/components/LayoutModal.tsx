import React from 'react';
import { X } from 'lucide-react-codex';

interface LayoutOptionProps {
  onClick: () => void;
  label: string;
  preview: React.ReactNode;
}

const LayoutOption: React.FC<LayoutOptionProps> = ({ onClick, label, preview }) => (
  <div onClick={onClick} className="cursor-pointer group">
    <div className="border border-gray-200 rounded-lg p-2 mb-2 group-hover:border-blue-500 group-hover:shadow-md transition-all bg-gray-50">{preview}</div>
    <div className="text-center text-xs font-medium text-gray-600">{label}</div>
  </div>
);

interface LayoutModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (structure: number[]) => void;
}

export const LayoutModal: React.FC<LayoutModalProps> = ({ show, onClose, onSelect }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Estructura de columnas">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[600px] transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800">Estructura de Columnas</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <LayoutOption onClick={() => onSelect([100])} label="1 Columna (100%)" preview={<div className="h-12 bg-blue-100 border border-blue-200 rounded w-full shadow-sm"></div>}/>
          <LayoutOption onClick={() => onSelect([50, 50])} label="2 Columnas (50/50)" preview={<div className="flex gap-2"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/2 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/2 shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([33, 33, 33])} label="3 Columnas (33/33/33)" preview={<div className="flex gap-1"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/3 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/3 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/3 shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([25, 25, 25, 25])} label="4 Columnas (25/25/25/25)" preview={<div className="flex gap-1"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/4 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/4 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/4 shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-1/4 shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([67, 33])} label="Asimétrico (67/33)" preview={<div className="flex gap-2"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[67%] shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[33%] shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([33, 67])} label="Asimétrico (33/67)" preview={<div className="flex gap-2"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[33%] shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[67%] shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([75, 25])} label="Lateral Derecho (75/25)" preview={<div className="flex gap-2"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[75%] shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[25%] shadow-sm"></div></div>}/>
          <LayoutOption onClick={() => onSelect([25, 75])} label="Lateral Izquierdo (25/75)" preview={<div className="flex gap-2"><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[25%] shadow-sm"></div><div className="h-12 bg-blue-100 border border-blue-200 rounded w-[75%] shadow-sm"></div></div>}/>
        </div>
      </div>
    </div>
  );
};
