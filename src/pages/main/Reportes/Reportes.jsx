import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReportes } from '../../../services/reportes/fetchReportes'
import { fetchTiposReporte } from '../../../services/reportes/fetchTiposReporte'
import { createReporte } from '../../../services/reportes/createReporte'
import { deleteReporte } from '../../../services/reportes/deleteReporte'
import { runReporteAdHoc } from '../../../services/reportes/runReporteAdHoc'
import ReporteDashboard from './ReporteDashboard'
import { confirmEliminar, toastExito } from '../../../services/alerts'
import '../../../styles/main/Reportes/ReporteDetalle.css'
import '../../../styles/main/Reportes/Reportes.css'

const paramsIniciales = (tipo) => {
  const out = {}
  ;(tipo?.params || []).forEach((p) => {
    out[p.key] = p.default !== undefined ? p.default : (p.type === 'boolean' ? false : '')
  })
  return out
}

export default function Reportes() {
  const navigate = useNavigate()
  const [reportes, setReportes] = useState([])
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoCode, setTipoCode] = useState('')
  const [params, setParams] = useState({})
  const [saving, setSaving] = useState(false)

  const [resultado, setResultado] = useState(null)
  const [ejecutando, setEjecutando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const tipoSel = useMemo(
    () => tipos.find((t) => t.tipo === tipoCode) || null,
    [tipos, tipoCode],
  )

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const [rs, ts] = await Promise.all([fetchReportes(), fetchTiposReporte()])
      setReportes(rs)
      setTipos(ts)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const onTipoChange = (code) => {
    setTipoCode(code)
    setParams(paramsIniciales(tipos.find((t) => t.tipo === code)))
  }

  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }))

  const abrirForm = () => {
    setNombre(''); setDescripcion(''); setTipoCode(''); setParams({})
    setShowForm(true)
  }

  const previsualizar = async () => {
    if (!tipoCode) return
    setEjecutando(true); setError('')
    try {
      setResultado(await runReporteAdHoc({ tipo: tipoCode, params }))
    } catch (e) {
      setError(e.message)
    } finally {
      setEjecutando(false)
    }
  }

  const guardar = async () => {
    if (!nombre || !tipoCode) { setError('Nombre y tipo son obligatorios'); return }
    setSaving(true); setError('')
    try {
      await createReporte({ nombre, descripcion, tipo: tipoCode, params })
      setShowForm(false)
      setResultado(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const ejecutar = (id) => navigate(`/admin/reportes/${id}`)

  const eliminar = async (id) => {
    const ok = await confirmEliminar({
      text: 'Se eliminará este reporte.',
    })
    if (!ok) return
    setError('')
    setEliminandoId(id)
    try {
      await deleteReporte(id)
      await cargar()
      toastExito('Reporte eliminado')
    } catch (e) {
      setError(e.message)
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <h1>Reportes</h1>
        <button className="btn-primary" onClick={abrirForm}>Nuevo reporte</button>
      </div>

      {error && <div className="reportes-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando reportes...</div>
      ) : !error && (
        <table className="reportes-tabla">
          <thead>
            <tr><th>Nombre</th><th>Tipo</th><th>Creado</th><th><span className="sr-only">Acciones</span></th></tr>
          </thead>
          <tbody>
            {reportes.length === 0 ? (
              <tr><td colSpan={4}>No hay reportes guardados</td></tr>
            ) : reportes.map((r) => (
              <tr key={r.id}>
                <td data-label="Nombre">{r.nombre}</td>
                <td data-label="Tipo">{(tipos.find((t) => t.tipo === r.tipo) || {}).label || r.tipo}</td>
                <td data-label="Creado">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                <td data-label="Acciones" className="reportes-acciones">
                  <button className="btn-secondary" onClick={() => ejecutar(r.id)}>Ver</button>
                  <button className="btn-secondary" onClick={() => eliminar(r.id)} disabled={eliminandoId === r.id}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="reportes-form">
          <h2>Nuevo reporte</h2>
          <label>Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label>Descripción
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
          <label>Tipo
            <select value={tipoCode} onChange={(e) => onTipoChange(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {tipos.map((t) => <option key={t.tipo} value={t.tipo}>{t.label}</option>)}
            </select>
          </label>

          {tipoSel && (tipoSel.params || []).map((p) => (
            <label key={p.key}>{p.label}
              {p.type === 'boolean' ? (
                <input type="checkbox" checked={!!params[p.key]} onChange={(e) => setParam(p.key, e.target.checked)} />
              ) : p.type === 'select' ? (
                <select value={params[p.key] ?? ''} onChange={(e) => setParam(p.key, e.target.value)}>
                  {(p.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={p.type === 'number' ? 'number' : 'text'}
                  value={params[p.key] ?? ''}
                  onChange={(e) =>
                    setParam(
                      p.key,
                      p.type === 'number'
                        ? (e.target.value === '' ? '' : Number(e.target.value))
                        : e.target.value,
                    )
                  }
                />
              )}
            </label>
          ))}

          <div className="reportes-form-acciones">
            <button className="btn-secondary" onClick={previsualizar} disabled={!tipoCode || ejecutando}>Previsualizar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}>Guardar</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setResultado(null) }}>Cancelar</button>
          </div>
        </div>
      )}

      {ejecutando && <div className="loading-box"><span className="loader"></span>Ejecutando reporte...</div>}
      {!ejecutando && resultado && <ReporteDashboard resultado={resultado} tipo={tipoCode} nombre={nombre || 'previsualizacion'} />}
    </div>
  )
}
