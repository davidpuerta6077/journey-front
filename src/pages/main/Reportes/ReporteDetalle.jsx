import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react'
import { fetchReporte } from '../../../services/reportes/fetchReporte'
import { fetchTiposReporte } from '../../../services/reportes/fetchTiposReporte'
import { runReporte } from '../../../services/reportes/runReporte'
import { exportarExcel } from './exportarExcel'
import ReporteDashboard from './ReporteDashboard'
import '../../../styles/main/Reportes/Reportes.css'
import '../../../styles/main/Reportes/ReporteDetalle.css'

export default function ReporteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [def, setDef] = useState(null)
  const [tipoLabel, setTipoLabel] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [d, tipos] = await Promise.all([fetchReporte(id), fetchTiposReporte()])
      setDef(d)
      setTipoLabel((tipos.find((t) => t.tipo === d.tipo) || {}).label || d.tipo)
      setResultado(await runReporte(id))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="reporte-detalle-page">
      <div className="reporte-detalle-header">
        <button className="btn-secondary" onClick={() => navigate('/admin/reportes')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="reporte-detalle-titulo">
          <h1>{def?.nombre || 'Reporte'}</h1>
          {tipoLabel && <span className="reporte-detalle-tipo">{tipoLabel}</span>}
        </div>
        <div className="reporte-detalle-acciones">
          <button className="btn-secondary" onClick={cargar} disabled={loading}>
            <RefreshCw size={16} /> Re-ejecutar
          </button>
          <button
            className="btn-primary"
            onClick={() => exportarExcel(resultado, def?.nombre || 'reporte')}
            disabled={loading || !resultado || !resultado.rows?.length}
          >
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {def?.descripcion && <p className="reporte-detalle-desc">{def.descripcion}</p>}
      {error && <div className="reportes-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Ejecutando reporte...</div>
      ) : !error && resultado && (
        <>
          <ReporteDashboard resultado={resultado} tipo={def?.tipo} />
          {resultado.meta?.generatedAt && (
            <p className="reporte-detalle-meta">
              Generado {new Date(resultado.meta.generatedAt).toLocaleString('es-CO')}
              {resultado.meta.fuente ? ` · fuente: ${resultado.meta.fuente}` : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}
