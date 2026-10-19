import React from 'react';
import { BlockType } from '../types';

interface WidgetButtonProps {
  icon: React.ReactNode;
  label: string;
  type: BlockType;
  iconColor?: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, type: BlockType) => void;
}

export const WidgetButton: React.FC<WidgetButtonProps> = ({ icon, label, type, iconColor, onClick, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, type)}
    onClick={onClick}
    className="neu-widget select-none"
  >
    <span className="neu-widget-icon" style={iconColor ? { color: iconColor } : undefined}>{icon}</span>
    <span className="neu-widget-label">{label}</span>
  </div>
);
