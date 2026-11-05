import { useState, useRef } from 'react'
import {
  Download, RefreshCw, FileSpreadsheet, FileUp, FolderOpen, Info, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Database, Settings, Check, Trophy, FileText, X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import '../styles/main/CargaMasiva/CargaMasiva.css'

const API_BASE = import.meta.env.VITE_URL_BASE
const TAMANO_MAX_MB = 50 // límite de express-fileupload en la API

// Pantalla común de Carga Masiva (usuarios, cursos, matrículas, cancelaciones).
// Cada página solo pasa su configuración:
//  - titulo, descripcion, icono (componente lucide)
//  - plantillas: [{ nombre, descripcion, archivo, filas: [[encabezados], ...ejemplos], campos: [{ col, desc }] }]
//  - nota: texto/JSX extra en el panel de información (opcional)
//  - subir(file) -> filePath, procesar(filePath) -> resultado de la API
//  - resumen(resultado) -> [{ label, valor, tono: 'ok' | 'error' | 'info' | 'marca', icono }] (opcional;
//    por defecto procesados / correctos / con errores a partir de successCount y errorCount)
export default function CargaMasiva({ titulo, descripcion, icono: Icono, plantillas, nota, subir, procesar, resumen, accept = '.xlsx,.xls' }) {
  const [archivo, setArchivo] = useState(null)
  const [filePath, setFilePath] = useState(null)
  const [estado, setEstado] = useState('idle') // idle | subiendo | listo | procesando | hecho | error
  const [resultado, setResultado] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [descargo, setDescargo] = useState(false)
  const [camposAbiertos, setCamposAbiertos] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef(null)

  const reiniciar = () => {
    setArchivo(null); setFilePath(null); setEstado('idle'); setResultado(null); setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const descargarPlantilla = (p) => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(p.filas), 'Plantilla')
    XLSX.writeFile(wb, p.archivo)
    setDescargo(true)
  }

  // Al elegir el archivo se sube de una vez; queda listo para procesar.
  const elegir = async (f) => {
    if (!f) return
    setResultado(null); setErrorMsg(''); setFilePath(null)
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!accept.split(',').includes(ext)) {
      setArchivo(null); setEstado('error'); setErrorMsg(`Formato no permitido. Usa ${accept.replaceAll(',', ', ')}.`); return
    }
    if (f.size > TAMANO_MAX_MB * 1024 * 1024) {
      setArchivo(null); setEstado('error'); setErrorMsg(`El archivo supera ${TAMANO_MAX_MB} MB.`); return
    }
    setArchivo(f); setEstado('subiendo')
    try {
      setFilePath(await subir(f))
      setEstado('listo')
    } catch (e) {
      setErrorMsg(e.message); setEstado('error')
    }
  }

  const procesarArchivo = async () => {
    if (!filePath) return
    setEstado('procesando'); setErrorMsg('')
    try {
      setResultado(await procesar(filePath))
      setEstado('hecho')
    } catch (e) {
      setErrorMsg(e.message); setEstado('error')
    } finally {
      setFilePath(null) // la API borra el archivo al procesarlo
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setArrastrando(false)
    if (estado === 'subiendo' || estado === 'procesando') return
    elegir(e.dataTransfer.files?.[0])
  }

  // Pasos: 1 plantilla, 2 archivo, 3 procesar.
  const hechos = [descargo || !!archivo, !!filePath || estado === 'procesando' || estado === 'hecho', estado === 'hecho']
  const activo = hechos.findIndex(h => !h)
  const PASOS = [
    { t: 'Descargar plantilla', s: 'Obtén la plantilla en formato Excel' },
    { t: 'Cargar archivo', s: 'Selecciona o arrastra tu archivo' },
    { t: 'Procesar información', s: 'Revisa el resultado' },
  ]

  const r = resultado || {}
  const tarjetas = resumen ? resumen(r) : [
    { label: 'Registros procesados', valor: (r.successCount || 0) + (r.errorCount || 0), tono: 'marca', icono: Database },
    { label: 'Registros correctos', valor: r.successCount || 0, tono: 'ok', icono: CheckCircle2 },
    { label: 'Registros con errores', valor: r.errorCount || 0, tono: 'error', icono: AlertTriangle },
  ]
  const ocupado = estado === 'subiendo' || estado === 'procesando'

  return (
    <div className="cm-page estilo-hub">
      <header className="cm-header">
        <div className="cm-header-titulo">
          <span className="cm-header-icono" aria-hidden="true"><Icono size={26} /></span>
          <div>
            <h2>{titulo}</h2>
            <p>{descripcion}</p>
          </div>
        </div>
        <div className="cm-header-acciones">
          {plantillas.map(p => (
            <button key={p.archivo} type="button" className="btn-secondary" onClick={() => descargarPlantilla(p)}>
              <Download size={15} /> {p.nombre}
            </button>
          ))}
          <button type="button" className="btn-secondary cm-btn-reiniciar" onClick={reiniciar} disabled={estado === 'idle' && !archivo}>
            <RefreshCw size={15} /> Reiniciar
          </button>
        </div>
      </header>

      <ol className="cm-pasos" aria-label="Pasos de la carga">
        {PASOS.map((p, i) => (
          <li key={p.t} className={`cm-paso${hechos[i] ? ' hecho' : ''}${i === activo ? ' activo' : ''}`} aria-current={i === activo ? 'step' : undefined}>
            <span className="cm-paso-num">{hechos[i] ? <Check size={16} /> : i + 1}</span>
            <span className="cm-paso-texto"><strong>{p.t}</strong><small>{p.s}</small></span>
          </li>
        ))}
      </ol>

      <div className="cm-grid">
        <section className="cm-panel" aria-labelledby="cm-cargar-titulo">
          <div className="cm-panel-titulo">
            <FileText size={20} />
            <div>
              <h3 id="cm-cargar-titulo">Cargar archivo</h3>
              <p>Arrastra tu archivo Excel aquí o selecciónalo desde tu equipo.</p>
            </div>
          </div>

          <div
            className={`cm-zona${arrastrando ? ' arrastrando' : ''}${archivo ? ' con-archivo' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
          >
            <input ref={inputRef} type="file" accept={accept} className="cm-input" tabIndex={-1} aria-hidden="true"
              onChange={(e) => elegir(e.target.files?.[0])} disabled={ocupado} />
            {archivo ? (
              <div className="cm-archivo">
                <FileSpreadsheet size={40} />
                <div className="cm-archivo-info">
                  <strong>{archivo.name}</strong>
                  <span>{(archivo.size / 1024).toFixed(0)} KB · {
                    estado === 'subiendo' ? 'Subiendo...' : estado === 'listo' ? 'Listo para procesar'
                      : estado === 'procesando' ? 'Procesando...' : estado === 'hecho' ? 'Procesado' : 'No se pudo cargar'}</span>
                </div>
                {!ocupado && (
                  <button type="button" className="btn-icon cm-quitar" onClick={reiniciar} aria-label="Quitar archivo"><X size={16} /></button>
                )}
              </div>
            ) : (
              <>
                <FileUp size={44} className="cm-zona-icono" />
                <strong className="cm-zona-titulo">Arrastra tu archivo aquí</strong>
                <span className="cm-zona-o">o</span>
                <button type="button" className="btn-primary cm-btn-elegir" onClick={() => inputRef.current?.click()} disabled={ocupado}>
                  <FolderOpen size={16} /> Seleccionar archivo
                </button>
              </>
            )}
            <span className="cm-zona-formatos">Formatos permitidos: {accept.replaceAll(',', ', ')} &nbsp;|&nbsp; Tamaño máximo: {TAMANO_MAX_MB} MB</span>
          </div>

          <div className="cm-procesar">
            <button type="button" className="btn-primary" onClick={procesarArchivo} disabled={estado !== 'listo'}>
              <Settings size={16} className={estado === 'procesando' ? 'cm-spin' : ''} />
              {estado === 'procesando' ? 'Procesando...' : 'Procesar archivo'}
            </button>
            {estado === 'error' && <p className="cm-error" role="alert"><AlertTriangle size={15} /> {errorMsg}</p>}
          </div>
        </section>

        <aside className="cm-panel" aria-labelledby="cm-info-titulo">
          <div className="cm-panel-titulo">
            <Info size={20} />
            <h3 id="cm-info-titulo">Información</h3>
          </div>
          {plantillas.map((p, i) => (
            <div key={p.archivo} className="cm-plantilla">
              <div className="cm-plantilla-cab">
                <span className="cm-plantilla-icono" aria-hidden="true"><FileSpreadsheet size={34} /></span>
                <div>
                  <strong>{p.nombre}</strong>
                  <p>{p.descripcion}</p>
                </div>
              </div>
              <div className="cm-plantilla-acciones">
                <button type="button" className="btn-secondary" onClick={() => descargarPlantilla(p)}><Download size={14} /> Descargar</button>
                <button type="button" className="btn-secondary" aria-expanded={camposAbiertos === i} onClick={() => setCamposAbiertos(camposAbiertos === i ? null : i)}>
                  {camposAbiertos === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Descripción de los campos
                </button>
              </div>
              {camposAbiertos === i && (
                <dl className="cm-campos">
                  {p.campos.map(c => (
                    <div key={c.col}><dt>{c.col}</dt><dd>{c.desc}</dd></div>
                  ))}
                </dl>
              )}
            </div>
          ))}
          {nota && <div className="cm-nota">{nota}</div>}
        </aside>
      </div>

      <section className="cm-panel cm-resultado" aria-labelledby="cm-res-titulo" aria-live="polite">
        <div className="cm-panel-titulo">
          <Trophy size={20} />
          <h3 id="cm-res-titulo">Resultado del proceso</h3>
          {!resultado && <span className="cm-res-espera">Aparece al procesar el archivo</span>}
        </div>
        <div className="cm-res-fila">
          {tarjetas.map(t => (
            <div key={t.label} className={`cm-stat cm-stat-${t.tono}`}>
              <span className="cm-stat-icono" aria-hidden="true"><t.icono size={22} /></span>
              <span className="cm-stat-texto"><strong>{t.valor}</strong><span>{t.label}</span></span>
            </div>
          ))}
          <div className="cm-res-descarga">
            {r.errorFileUrl ? (
              <a className="btn-secondary" href={`${API_BASE}${r.errorFileUrl}`} download><Download size={15} /> Descargar reporte de errores</a>
            ) : (
              <button type="button" className="btn-secondary" disabled title="Solo se genera si hay registros con errores"><Download size={15} /> Descargar reporte de errores</button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
