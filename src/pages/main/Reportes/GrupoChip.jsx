// Etiqueta del grupo al que pertenece una columna del constructor (Estudiante,
// Curso, Matrícula, Moodle, Riesgo...), con un color fijo por grupo.
const COLOR_GRUPO = {
  Estudiante: '#4a70e0', Usuario: '#4a70e0', 'Usuario enviado': '#4a70e0',
  Curso: '#9b59b6', 'Curso enviado': '#9b59b6',
  'Matrícula': '#1f9e9e', 'Matrícula enviada': '#1f9e9e', Novedad: '#1f9e9e',
  Moodle: '#e0733a',
  Riesgo: '#d64545',
}

export default function GrupoChip({ grupo, children }) {
  if (!grupo) return null
  return (
    <span className="crep-grupo-chip" style={{ '--grupo': COLOR_GRUPO[grupo] || '#6b7280' }}>
      {grupo}{children}
    </span>
  )
}
