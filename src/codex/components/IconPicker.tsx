import React, { useState } from 'react';
import { Search, X } from 'lucide-react-codex';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const FA_ICONS: { category: string; icons: { name: string; class: string }[] }[] = [
  {
    category: '⭐ Más usados',
    icons: [
      { name: 'Bombilla', class: 'fa-lightbulb' },
      { name: 'Estrella', class: 'fa-star' },
      { name: 'Corazón', class: 'fa-heart' },
      { name: 'Check', class: 'fa-check' },
      { name: 'Check círculo', class: 'fa-check-circle' },
      { name: 'Info', class: 'fa-info-circle' },
      { name: 'Advertencia', class: 'fa-exclamation-triangle' },
      { name: 'Error', class: 'fa-times-circle' },
      { name: 'Flecha derecha', class: 'fa-arrow-right' },
      { name: 'Flecha arriba', class: 'fa-arrow-up' },
      { name: 'Enlace', class: 'fa-link' },
      { name: 'Buscar', class: 'fa-search' },
      { name: 'Tarea', class: 'fa-clipboard-check' },
{ name: 'Cuestionario', class: 'fa-clipboard-list' },
{ name: 'Foro', class: 'fa-comments' },
{ name: 'Objetivo', class: 'fa-bullseye' },
    ]
  },
  {
    category: '🎓 Educación',
    icons: [
      { name: 'Graduación', class: 'fa-graduation-cap' },
      { name: 'Libro', class: 'fa-book' },
      { name: 'Libro abierto', class: 'fa-book-open' },
      { name: 'Lápiz', class: 'fa-pencil-alt' },
      { name: 'Regla', class: 'fa-ruler' },
      { name: 'Pizarrón', class: 'fa-chalkboard' },
      { name: 'Profesor', class: 'fa-chalkboard-teacher' },
      { name: 'Escuela', class: 'fa-school' },
      { name: 'Universidad', class: 'fa-university' },
      { name: 'Microscopio', class: 'fa-microscope' },
      { name: 'Átomo', class: 'fa-atom' },
      { name: 'Calculadora', class: 'fa-calculator' },
      { name: 'Mochila', class: 'fa-backpack' },
      { name: 'Certificado', class: 'fa-certificate' },
      { name: 'Diploma', class: 'fa-file-alt' },
      { name: 'Trofeo', class: 'fa-trophy' },
      { name: 'Medalla', class: 'fa-medal' },
      { name: 'Globo terráqueo', class: 'fa-globe' },
    ]
  },
  {
    category: '💻 Tecnología',
    icons: [
      { name: 'Computador', class: 'fa-laptop' },
      { name: 'Monitor', class: 'fa-desktop' },
      { name: 'Móvil', class: 'fa-mobile-alt' },
      { name: 'Tablet', class: 'fa-tablet-alt' },
      { name: 'Código', class: 'fa-code' },
      { name: 'Terminal', class: 'fa-terminal' },
      { name: 'Base de datos', class: 'fa-database' },
      { name: 'Nube', class: 'fa-cloud' },
      { name: 'Wifi', class: 'fa-wifi' },
      { name: 'Servidor', class: 'fa-server' },
      { name: 'Robot', class: 'fa-robot' },
      { name: 'Chip', class: 'fa-microchip' },
      { name: 'Engranaje', class: 'fa-cog' },
      { name: 'Engranajes', class: 'fa-cogs' },
      { name: 'Cerradura', class: 'fa-lock' },
      { name: 'Bug', class: 'fa-bug' },
      { name: 'Plug', class: 'fa-plug' },
      { name: 'Batería', class: 'fa-battery-full' },
    ]
  },
  {
    category: '📋 Proyectos',
    icons: [
      { name: 'Tareas', class: 'fa-tasks' },
      { name: 'Proyecto', class: 'fa-project-diagram' },
      { name: 'Diagrama', class: 'fa-sitemap' },
      { name: 'Gráfica', class: 'fa-chart-bar' },
      { name: 'Gráfica línea', class: 'fa-chart-line' },
      { name: 'Gráfica circular', class: 'fa-chart-pie' },
      { name: 'Clipboard', class: 'fa-clipboard-list' },
      { name: 'Lista', class: 'fa-list-alt' },
      { name: 'Calendario', class: 'fa-calendar-alt' },
      { name: 'Reloj', class: 'fa-clock' },
      { name: 'Bandera', class: 'fa-flag' },
      { name: 'Meta', class: 'fa-bullseye' },
      { name: 'Cohete', class: 'fa-rocket' },
      { name: 'Maletín', class: 'fa-briefcase' },
      { name: 'Dinero', class: 'fa-dollar-sign' },
      { name: 'Balanza', class: 'fa-balance-scale' },
      { name: 'Handshake', class: 'fa-handshake' },
      { name: 'Usuarios', class: 'fa-users' },
    ]
  },
  {
    category: '⚠️ Importante',
    icons: [
      { name: 'Alerta', class: 'fa-exclamation-circle' },
      { name: 'Prohibido', class: 'fa-ban' },
      { name: 'Fuego', class: 'fa-fire' },
      { name: 'Escudo', class: 'fa-shield-alt' },
      { name: 'Ojo', class: 'fa-eye' },
      { name: 'Favorito', class: 'fa-bookmark' },
      { name: 'Nota', class: 'fa-sticky-note' },
      { name: 'Comentario', class: 'fa-comment-alt' },
      { name: 'Megáfono', class: 'fa-bullhorn' },
      { name: 'Campana', class: 'fa-bell' },
      { name: 'Pin', class: 'fa-map-pin' },
      { name: 'Candado abierto', class: 'fa-lock-open' },
    ]
  },
  {
  category: '📚 Recursos educativos',
  icons: [
    { name: 'Tarea', class: 'fa-clipboard-check' },
    { name: 'Cuestionario', class: 'fa-clipboard-list' },
    { name: 'Foro', class: 'fa-comments' },
    { name: 'Evaluación', class: 'fa-check-square' },
    { name: 'Rúbrica', class: 'fa-table' },
    { name: 'Portafolio', class: 'fa-folder-open' },
    { name: 'Lectura', class: 'fa-book-reader' },
    { name: 'Investigación', class: 'fa-search-plus' },
    { name: 'Experimento', class: 'fa-flask' },
    { name: 'Presentación', class: 'fa-chalkboard' },
    { name: 'Video clase', class: 'fa-video' },
    { name: 'Podcast', class: 'fa-headphones' },
    { name: 'Recurso web', class: 'fa-globe' },
    { name: 'Objetivo', class: 'fa-bullseye' },
    { name: 'Competencia', class: 'fa-award' },
    { name: 'Retroalimentación', class: 'fa-comment-dots' },
    { name: 'Autoevaluación', class: 'fa-user-check' },
    { name: 'Coevaluación', class: 'fa-users' },
    { name: 'Evidencia', class: 'fa-camera' },
    { name: 'Entrega', class: 'fa-paper-plane' },
    { name: 'Tiempo', class: 'fa-hourglass-half' },
    { name: 'Dificultad', class: 'fa-layer-group' },
    { name: 'Mapa conceptual', class: 'fa-project-diagram' },
    { name: 'Debate', class: 'fa-exchange-alt' },
    { name: 'Pregunta círculo', class: 'fa-question-circle' },
{ name: 'Pregunta', class: 'fa-question' },
{ name: 'Dado', class: 'fa-dice' },
{ name: 'Puzzle', class: 'fa-puzzle-piece' },
{ name: 'Lupa pregunta', class: 'fa-search' },
    { name: 'Trabajo grupal', class: 'fa-people-carry' },
  ]
},
  {
    category: '🧩 General',
    icons: [
      { name: 'Casa', class: 'fa-home' },
      { name: 'Usuario', class: 'fa-user' },
      { name: 'Grupo', class: 'fa-user-friends' },
      { name: 'Imagen', class: 'fa-image' },
      { name: 'Video', class: 'fa-video' },
      { name: 'Música', class: 'fa-music' },
      { name: 'Auriculares', class: 'fa-headphones' },
      { name: 'Micrófono', class: 'fa-microphone' },
      { name: 'Carpeta', class: 'fa-folder-open' },
      { name: 'Archivo', class: 'fa-file' },
      { name: 'PDF', class: 'fa-file-pdf' },
      { name: 'Excel', class: 'fa-file-excel' },
      { name: 'Word', class: 'fa-file-word' },
      { name: 'Descarga', class: 'fa-download' },
      { name: 'Subida', class: 'fa-upload' },
      { name: 'Compartir', class: 'fa-share-alt' },
      { name: 'Impresora', class: 'fa-print' },
      { name: 'Papelera', class: 'fa-trash-alt' },
    ]
  },
];

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const allIcons = FA_ICONS.flatMap(cat => cat.icons);

  const filtered = search.trim()
    ? Array.from(
        new Map(
          allIcons
            .filter(i =>
              i.name.toLowerCase().includes(search.toLowerCase()) ||
              i.class.toLowerCase().includes(search.toLowerCase())
            )
            .map(i => [i.class, i])
        ).values()
      )
    : null;

  return (
    <div className="space-y-2">
      {/* Preview + botón abrir */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <i className={`fas ${value} fa-lg text-blue-600`}></i>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Clase actual: <code className="bg-gray-100 px-1 rounded">{value || 'ninguna'}</code></p>
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
          >
            {open ? 'Cerrar selector' : 'Seleccionar icono'}
          </button>
        </div>
      </div>

      {/* Panel del selector */}
      {open && (
        <div className="border border-blue-200 rounded-xl bg-white shadow-lg p-3 max-h-72 overflow-y-auto">
          {/* Buscador */}
          <div className="relative mb-3 sticky top-0 bg-white pb-2 border-b border-gray-100">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Buscar icono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12}/>
              </button>
            )}
          </div>

          {/* Resultados */}
          {filtered ? (
            filtered.length > 0 ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-6 gap-1">
                  {filtered.map(icon => (
                    <button
                      key={icon.class}
                      onClick={() => { onChange(icon.class); setOpen(false); setSearch(''); }}
                      title={icon.name}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all hover:border-blue-400 hover:bg-blue-50 ${value === icon.class ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-gray-100'}`}
                    >
                      <i className={`fas ${icon.class} text-gray-600`}></i>
                      <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight truncate w-full">{icon.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">Sin resultados para "{search}"</p>
            )
          ) : (
            FA_ICONS.map(cat => (
              <div key={cat.category} className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2">{cat.category}</p>
                <div className="grid grid-cols-6 gap-1">
                  {cat.icons.map(icon => (
                    <button
                      key={icon.class}
                      onClick={() => { onChange(icon.class); setOpen(false); }}
                      title={icon.name}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all hover:border-blue-400 hover:bg-blue-50 ${value === icon.class ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-gray-100'}`}
                    >
                      <i className={`fas ${icon.class} text-gray-600`}></i>
                      <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight truncate w-full">{icon.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
