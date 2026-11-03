import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, X, Plus, Save, Search, SlidersHorizontal } from 'lucide-react'
import { fetchCatalogoConstructor } from '../../../services/reportes/fetchCatalogoConstructor'
import { runReporteAdHoc } from '../../../services/reportes/runReporteAdHoc'
import { createReporte } from '../../../services/reportes/createReporte'
import { updateReporte } from '../../../services/reportes/updateReporte'
import { toastExito } from '../../../services/alerts'
import ConstructorResultado from './ConstructorResultado'
import GrupoChip from './GrupoChip'
import '../../../styles/main/Reportes/Reportes.css'
import '../../../styles/main/Reportes/ReporteDetalle.css'
import '../../../styles/main/Reportes/Constructor.css'

// Operadores por tipo de columna (las claves son las de services/reports/builder/filtros.js).
const OPS = {
  texto: [['eq', 'es igual a'], ['neq', 'es distinto de'], ['contains', 'contiene'], ['in', 'es uno de (separados por coma)'], ['empty', 'está vacío'], ['not_empty', 'no está vacío'], ['periodo_actual', 'es el más reciente']],
  numero: [['eq', 'es igual a'], ['neq', 'es distinto de'], ['gt', 'mayor que'], ['lt', 'menor que'], ['between', 'entre'], ['empty', 'está vacío'], ['not_empty', 'no está vacío']],
  fecha: [['between', 'entre'], ['gt', 'después de'], ['lt', 'antes de'], ['empty', 'está vacío'], ['not_empty', 'no está vacío']],
  bool: [['eq', 'es'], ['empty', 'está vacío']],
}
const SIN_VALOR = ['empty', 'not_empty', 'periodo_actual']

const CRITERIOS = [
  { key: 'nunca_entro', label: 'Nunca entró al curso' },
  { key: 'sin_acceso', label: 'Días sin entrar al curso, más de', unidad: 'días' },
  { key: 'nota_baja', label: 'Calificación menor que', unidad: 'de 5', paso: 0.1 },
  { key: 'entregas_vencidas', label: 'Entregas vencidas sin hacer, más de', unidad: 'tareas' },
  { key: 'avance_bajo', label: 'Avance del curso menor que', unidad: '%' },
]

// Un filtro está listo para enviarse cuando su operador no pide valor o ya lo tiene.
const filtroCompleto = (f) => f.col && f.op && (SIN_VALOR.includes(f.op) || (f.op === 'between'
  ? Array.isArray(f.valor) && f.valor.some((v) => v !== '' && v != null)
  : f.valor !== '' && f.valor != null))

const paraApi = (f) => (f.op === 'in' && typeof f.valor === 'string'
  ? { ...f, valor: f.valor.split(',').map((s) => s.trim()).filter(Boolean) }
  : f)

// Sustantivo de las cifras cuando el informe no trae vista.sustantivo.
const SUSTANTIVO = { matriculas: 'matrículas', usuarios: 'usuarios', cursos: 'cursos', novedades: 'novedades', moodle_usuarios: 'usuarios', moodle_cursos: 'cursos', moodle_matriculas: 'matrículas' }

// Un informe. Por defecto se ve como informe (filtros rápidos, cifras, gráficos
// y listado); "Personalizar" abre a la izquierda el panel para elegir datos,
// columnas, filtros, gráficos y riesgo. Arranca con los params de `reporte`
// (guardado) o de `plantilla` (nuevo desde la galería).
export default function Constructor({ reporte, plantilla }) {
  const navigate = useNavigate()
  const p0 = reporte?.params || plantilla?.params || {}
  const [avanzado, setAvanzado] = useState(!reporte && !plantilla)
  const [catalogo, setCatalogo] = useState(null)
  const [dataset, setDataset] = useState(p0.dataset || 'matriculas')
  const [columnas, setColumnas] = useState(p0.columnas || null)
  const [filtros, setFiltros] = useState((p0.filtros || []).map((f) => ({ ...f, valor: f.op === 'in' && Array.isArray(f.valor) ? f.valor.join(', ') : f.valor ?? '' })))
  const [agrupar, setAgrupar] = useState(p0.agrupar || [])
  const [riesgo, setRiesgo] = useState(p0.riesgo || null)
  const [nombre, setNombre] = useState(reporte?.nombre || plantilla?.titulo || '')
  const [buscar, setBuscar] = useState('')

  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const pedido = useRef(0)
  const [destinoListado, setDestinoListado] = useState(null)

  useEffect(() => {
    fetchCatalogoConstructor().then(setCatalogo).catch((e) => setError(e.message))
  }, [])

  const ds = catalogo?.datasets.find((d) => d.key === dataset)
  const porKey = useMemo(() => new Map((ds?.columnas || []).map((c) => [c.key, c])), [ds])
  const elegidas = (columnas || ds?.defecto || []).filter((k) => porKey.has(k))
  const usaRiesgo = [...elegidas, ...filtros.map((f) => f.col)].some((k) => porKey.get(k)?.grupo === 'Riesgo')
  const usaMoodle = [...elegidas, ...filtros.map((f) => f.col)].some((k) => porKey.get(k)?.moodle)
  const riesgoCfg = riesgo || catalogo?.riesgo

  const params = {
    dataset,
    columnas: elegidas,
    filtros: filtros.filter(filtroCompleto).map(paraApi),
    agrupar: agrupar.filter(Boolean),
    ...(p0.vista ? { vista: p0.vista } : {}),
    ...(usaRiesgo && riesgoCfg ? { riesgo: riesgoCfg } : {}),
  }

  // Lo que cambia la consulta (no la agrupación, que se arma en el navegador).
  const claveConsulta = JSON.stringify({ ...params, agrupar: undefined, vista: undefined })

  useEffect(() => {
    if (!ds) return
    const id = ++pedido.current
    const t = setTimeout(async () => {
      setCargando(true)
      try {
        const r = await runReporteAdHoc({ tipo: 'constructor', params })
        if (id === pedido.current) { setResultado(r); setError('') }
      } catch (e) {
        if (id === pedido.current) setError(e.message)
      } finally {
        if (id === pedido.current) setCargando(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [claveConsulta, ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarDataset = (k) => {
    setDataset(k); setColumnas(null); setFiltros([]); setAgrupar([]); setResultado(null)
  }
  const toggleCol = (k) => setColumnas(elegidas.includes(k) ? elegidas.filter((x) => x !== k) : [...elegidas, k])
  const mover = (i, d) => {
    const l = [...elegidas]
    ;[l[i], l[i + d]] = [l[i + d], l[i]]
    setColumnas(l)
  }

  const q = buscar.trim().toLowerCase()
  const visibles = (ds?.columnas || []).filter((c) => !q || c.label.toLowerCase().includes(q))
  const grupos = [...new Set(visibles.map((c) => c.grupo))]

  const setFiltro = (i, cambio) => setFiltros((fs) => fs.map((f, j) => (j === i ? { ...f, ...cambio } : f)))
  const agregarFiltro = () => {
    const col = ds.columnas[0]
    setFiltros((fs) => [...fs, { col: col.key, op: OPS[col.tipo][0][0], valor: '' }])
  }

  const setCriterio = (k, cambio) => setRiesgo({ ...riesgoCfg, criterios: { ...riesgoCfg.criterios, [k]: { ...riesgoCfg.criterios[k], ...cambio } } })
  const setCorte = (k, v) => setRiesgo({ ...riesgoCfg, cortes: { ...riesgoCfg.cortes, [k]: Number(v) } })

  const guardar = async (comoNuevo) => {
    if (!nombre.trim()) { setError('Ponle un nombre al reporte para guardarlo'); return }
    setGuardando(true); setError('')
    try {
      if (reporte && !comoNuevo) {
        await updateReporte(reporte.id, { nombre: nombre.trim(), params })
      } else {
        const r = await createReporte({ nombre: nombre.trim(), tipo: 'constructor', params })
        navigate(`/admin/reportes/${r.id}`)
      }
      toastExito('Reporte guardado')
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const inputValor = (f, i) => {
    const tipo = porKey.get(f.col)?.tipo
    if (SIN_VALOR.includes(f.op)) return null
    if (tipo === 'bool') {
      return (
        <select value={String(f.valor)} onChange={(e) => setFiltro(i, { valor: e.target.value === '' ? '' : e.target.value === 'true' })} aria-label="Valor">
          <option value="">— Elegir —</option><option value="true">Sí</option><option value="false">No</option>
        </select>
      )
    }
    const type = tipo === 'fecha' ? 'date' : tipo === 'numero' ? 'number' : 'text'
    if (f.op === 'between') {
      const [a = '', b = ''] = Array.isArray(f.valor) ? f.valor : []
      return (
        <div className="crep-entre">
          <input type={type} value={a} onChange={(e) => setFiltro(i, { valor: [e.target.value, b] })} aria-label="Desde" placeholder="desde" />
          <input type={type} value={b} onChange={(e) => setFiltro(i, { valor: [a, e.target.value] })} aria-label="Hasta" placeholder="hasta" />
        </div>
      )
    }
    return <input type={type} value={f.valor ?? ''} onChange={(e) => setFiltro(i, { valor: e.target.value })} aria-label="Valor" placeholder="valor" />
  }

  if (!catalogo) {
    return (
      <div className="reporte-detalle-page">
        {error ? <div className="reportes-error">{error}</div> : <div className="loading-box"><span className="loader"></span>Cargando columnas...</div>}
      </div>
    )
  }

  return (
    <div className="reporte-detalle-page crep-page">
      <div className="reporte-detalle-header">
        <button className="btn-secondary" onClick={() => navigate('/admin/reportes')}><ArrowLeft size={16} /> Volver</button>
        <div className="reporte-detalle-titulo">
          <h1>{reporte?.nombre || plantilla?.titulo || 'Informe en blanco'}</h1>
          <span className="reporte-detalle-tipo">{plantilla?.pregunta || reporte?.descripcion || 'Elige los datos, columnas y filtros a la izquierda'}</span>
        </div>
        <div className="reporte-detalle-acciones">
          <button type="button" className={avanzado ? 'btn-primary' : 'btn-secondary'} onClick={() => setAvanzado((v) => !v)} aria-pressed={avanzado}>
            <SlidersHorizontal size={15} /> {avanzado ? 'Ocultar opciones' : 'Personalizar'}
          </button>
          {!reporte && !avanzado && (
            <button type="button" className="btn-primary" onClick={() => guardar(false)} disabled={guardando}><Save size={15} /> Guardar en mis informes</button>
          )}
        </div>
      </div>
      {error && <div className="reportes-error">{error}</div>}

      <div className={`crep-layout${avanzado ? '' : ' sin-panel'}`}>
        {avanzado && <aside className="crep-panel">
          <section className="crep-seccion">
            <label className="crep-label" htmlFor="crep-dataset">Datos</label>
            <select id="crep-dataset" value={dataset} onChange={(e) => cambiarDataset(e.target.value)}>
              {catalogo.datasets.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </section>

          <details className="crep-seccion" open>
            <summary className="crep-label">Columnas ({elegidas.length} de {ds.columnas.length})</summary>
            <label className="crep-buscar">
              <Search size={14} />
              <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar columna" aria-label="Buscar columna" />
            </label>
            <div className="crep-acciones">
              <button type="button" className="btn-secondary" onClick={() => setColumnas([...new Set([...elegidas, ...visibles.map((c) => c.key)])])}>Marcar todas</button>
              <button type="button" className="btn-secondary" onClick={() => setColumnas(elegidas.filter((k) => !visibles.some((c) => c.key === k)))}>Ninguna</button>
            </div>
            <div className="crep-columnas">
              {grupos.map((g) => {
                const delGrupo = visibles.filter((c) => c.grupo === g)
                const marcadas = delGrupo.filter((c) => elegidas.includes(c.key)).length
                return (
                  <details key={g} className="crep-grupo" open={!!q || marcadas > 0}>
                    <summary>
                      <GrupoChip grupo={g} />
                      <span className="crep-grupo-cuenta">{marcadas} de {delGrupo.length}</span>
                    </summary>
                    {delGrupo.map((c) => (
                      <label key={c.key} className="crep-check">
                        <input type="checkbox" checked={elegidas.includes(c.key)} onChange={() => toggleCol(c.key)} />
                        {c.label}
                      </label>
                    ))}
                  </details>
                )
              })}
            </div>
            {elegidas.length > 0 && (
              <>
                <span className="crep-sublabel">Orden en la tabla</span>
                <ol className="crep-orden">
                  {elegidas.map((k, i) => (
                    <li key={k}>
                      <span className="crep-orden-num">{i + 1}</span>
                      <span className="crep-orden-nombre" title={`${porKey.get(k).label} · ${porKey.get(k).grupo}`}>{porKey.get(k).label}</span>
                      <GrupoChip grupo={porKey.get(k).grupo} />
                      <button type="button" className="btn-icon" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir" aria-label={`Subir ${porKey.get(k).label}`}><ArrowUp size={13} /></button>
                      <button type="button" className="btn-icon" onClick={() => mover(i, 1)} disabled={i === elegidas.length - 1} title="Bajar" aria-label={`Bajar ${porKey.get(k).label}`}><ArrowDown size={13} /></button>
                      <button type="button" className="btn-icon" onClick={() => toggleCol(k)} title="Quitar" aria-label={`Quitar ${porKey.get(k).label}`}><X size={13} /></button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </details>

          <details className="crep-seccion" open>
            <summary className="crep-label">Filtros ({filtros.length})</summary>
            {filtros.map((f, i) => {
              const tipo = porKey.get(f.col)?.tipo || 'texto'
              return (
                <div key={i} className="crep-filtro">
                  <select value={f.col} onChange={(e) => { const t = porKey.get(e.target.value).tipo; setFiltro(i, { col: e.target.value, op: OPS[t][0][0], valor: '' }) }} aria-label="Columna">
                    {[...new Set(ds.columnas.map((c) => c.grupo))].map((g) => (
                      <optgroup key={g} label={g}>
                        {ds.columnas.filter((c) => c.grupo === g).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <select value={f.op} onChange={(e) => setFiltro(i, { op: e.target.value, valor: e.target.value === 'between' ? ['', ''] : '' })} aria-label="Condición">
                    {OPS[tipo].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  {inputValor(f, i)}
                  <button type="button" className="btn-icon crep-quitar" onClick={() => setFiltros(filtros.filter((_, j) => j !== i))} title="Quitar filtro" aria-label="Quitar filtro"><X size={14} /></button>
                </div>
              )
            })}
            <button type="button" className="btn-secondary" onClick={agregarFiltro}><Plus size={14} /> Agregar filtro</button>
          </details>

          <details className="crep-seccion" open>
            <summary className="crep-label">Gráficos</summary>
            <span className="crep-sublabel">Cuenta las filas según la columna elegida</span>
            {[0, 1].map((n) => (
              <select key={n} value={agrupar[n] || ''} disabled={n === 1 && !agrupar[0]} aria-label={n === 0 ? 'Primer gráfico' : 'Segundo gráfico'}
                onChange={(e) => { const a = [...agrupar]; a[n] = e.target.value; setAgrupar(n === 0 && !e.target.value ? [] : a) }}>
                <option value="">{n === 0 ? '— Sin gráficos —' : '— Sin segundo gráfico —'}</option>
                {[...new Set(elegidas.map((k) => porKey.get(k).grupo))].map((g) => (
                  <optgroup key={g} label={g}>
                    {elegidas.filter((k) => porKey.get(k).grupo === g).map((k) => <option key={k} value={k}>{porKey.get(k).label}</option>)}
                  </optgroup>
                ))}
              </select>
            ))}
          </details>

          {usaRiesgo && riesgoCfg && (
            <details className="crep-seccion" open>
              <summary className="crep-label">Riesgo</summary>
              {CRITERIOS.map((c) => {
                const cfg = riesgoCfg.criterios[c.key] || {}
                return (
                  <div key={c.key} className="crep-criterio">
                    <label className="crep-check">
                      <input type="checkbox" checked={!!cfg.activo} onChange={(e) => setCriterio(c.key, { activo: e.target.checked })} />
                      {c.label}
                    </label>
                    {c.unidad && (
                      <span className="crep-umbral">
                        <input type="number" step={c.paso || 1} min="0" value={cfg.valor ?? ''} disabled={!cfg.activo}
                          onChange={(e) => setCriterio(c.key, { valor: e.target.value === '' ? '' : Number(e.target.value) })} aria-label={c.label} />
                        {c.unidad}
                      </span>
                    )}
                  </div>
                )
              })}
              <span className="crep-sublabel">Nivel según criterios cumplidos</span>
              <div className="crep-cortes">
                <label>Alto desde <input type="number" min="1" value={riesgoCfg.cortes.alto} onChange={(e) => setCorte('alto', e.target.value)} /></label>
                <label>Medio desde <input type="number" min="1" value={riesgoCfg.cortes.medio} onChange={(e) => setCorte('medio', e.target.value)} /></label>
                <span>Bajo: 1 criterio</span>
              </div>
            </details>
          )}

          <section className="crep-seccion">
            <label className="crep-label" htmlFor="crep-nombre">Guardar como</label>
            <input id="crep-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del reporte" />
            <div className="crep-acciones">
              <button type="button" className="btn-primary" onClick={() => guardar(false)} disabled={guardando}><Save size={15} /> {reporte ? 'Guardar cambios' : 'Guardar reporte'}</button>
              {reporte && <button type="button" className="btn-secondary" onClick={() => guardar(true)} disabled={guardando}>Guardar como nuevo</button>}
            </div>
          </section>
        </aside>}

        <div className="crep-main">
          {cargando && (
            <div className="loading-box"><span className="loader"></span>
              {usaMoodle ? 'Consultando Nexo y Moodle (puede tardar un poco)...' : 'Consultando...'}
            </div>
          )}
          {resultado && (
            <div className={cargando ? 'crep-actualizando' : undefined}>
              <ConstructorResultado
                titulo={nombre || reporte?.nombre || ds.label}
                sustantivo={(dataset === p0.dataset && p0.vista?.sustantivo) || SUSTANTIVO[dataset]}
                columns={resultado.columns}
                rows={resultado.rows}
                agrupar={agrupar.filter(Boolean)}
                avisos={resultado.meta?.avisos}
                destinoListado={destinoListado}
              />
            </div>
          )}
        </div>
      </div>
      <div ref={setDestinoListado} className="inf-listado-destino" />
    </div>
  )
}
