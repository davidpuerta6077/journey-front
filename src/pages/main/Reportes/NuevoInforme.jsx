import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react'
import Constructor from './Constructor'
import { PLANTILLAS } from './plantillasInforme'
import '../../../styles/main/Reportes/Reportes.css'
import '../../../styles/main/Reportes/ReporteDetalle.css'
import '../../../styles/main/Reportes/Constructor.css'

// /admin/reportes/constructor: galería de preguntas frecuentes para arrancar un
// informe sin armar nada. ?p=<id> abre la plantilla; ?p=blanco, el constructor vacío.
export default function NuevoInforme() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const p = search.get('p')
  const plantilla = PLANTILLAS.find((x) => x.id === p)

  if (plantilla) return <Constructor key={plantilla.id} plantilla={plantilla} />
  if (p === 'blanco') return <Constructor key="blanco" />

  return (
    <div className="reporte-detalle-page inf-galeria-page">
      <div className="reporte-detalle-header">
        <button className="btn-secondary" onClick={() => navigate('/admin/reportes')}><ArrowLeft size={16} /> Volver</button>
        <div className="reporte-detalle-titulo">
          <h1>Nuevo informe</h1>
          <span className="reporte-detalle-tipo">Elige qué quieres saber. Luego puedes filtrar, exportar y guardarlo.</span>
        </div>
      </div>

      <ul className="inf-galeria">
        {PLANTILLAS.map((t) => {
          const Icono = t.icono
          return (
            <li key={t.id}>
              <button type="button" className="inf-plantilla" onClick={() => setSearch({ p: t.id })}>
                <span className="inf-plantilla-icono"><Icono size={20} /></span>
                <span className="inf-plantilla-texto">
                  <strong>{t.pregunta}</strong>
                  <span>{t.descripcion}</span>
                </span>
                <ArrowRight size={16} className="inf-plantilla-flecha" />
              </button>
            </li>
          )
        })}
        <li>
          <button type="button" className="inf-plantilla inf-plantilla-blanco" onClick={() => setSearch({ p: 'blanco' })}>
            <span className="inf-plantilla-icono"><Wand2 size={20} /></span>
            <span className="inf-plantilla-texto">
              <strong>Armar uno desde cero</strong>
              <span>Para pedidos especiales: eliges cualquier dato de Nexo y Moodle, columnas, filtros y gráficos.</span>
            </span>
            <ArrowRight size={16} className="inf-plantilla-flecha" />
          </button>
        </li>
      </ul>
    </div>
  )
}
