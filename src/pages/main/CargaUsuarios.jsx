import { useState, useCallback } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertCircle, Download, Info, FileSpreadsheet, Settings } from 'lucide-react'
import * as XLSX from 'xlsx'
import { uploadExcel } from '../../services/carga/uploadExcel'
import { processExcel } from '../../services/carga/processExcel'
import "../../styles/main/CargaUsuarios.css";

const API_BASE = import.meta.env.VITE_URL_BASE|| 'http://localhost:3001'

const CAMPOS = [
  { col: 'name',      desc: 'Nombre del usuario' },
  { col: 'last_name', desc: 'Apellido del usuario' },
  { col: 'document',  desc: 'Número de documento (se usa como contraseña inicial)' },
  { col: 'email',     desc: 'Correo institucional (se usa como username)' },
]

export default function CargaUsuariosP() {
  const [file, setFile]             = useState(null)
  const [filePath, setFilePath]     = useState(null)
  const [estado, setEstado]         = useState('idle')
  const [resultado, setResultado]   = useState(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [verCampos, setVerCampos]   = useState(false)

  const resetForm = useCallback(() => {
    setFile(null)
    setFilePath(null)
    setEstado('idle')
    setResultado(null)
    setErrorMsg('')
  }, [])

  const descargarPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([['name', 'last_name', 'document', 'email']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, 'plantilla_usuarios.xlsx')
  }

  const handleFileChange = (e) => {
    resetForm()
    setFile(e.target.files[0] || null)
  }

  const handleSubir = async () => {
    if (!file) return
    setEstado('uploading')
    setErrorMsg('')
    try {
      const path = await uploadExcel(file)
      setFilePath(path)
      setEstado('uploaded')
    } catch (e) {
      setErrorMsg(e.message)
      setEstado('error')
    }
  }

  const handleProcesar = async () => {
    if (!filePath) return
    setEstado('processing')
    setErrorMsg('')
    try {
      const result = await processExcel(filePath)
      setResultado(result)
      setEstado('done')
    } catch (e) {
      setErrorMsg(e.message)
      setEstado('error')
    } finally {
      setFilePath(null)
    }
  }

  const isUploading  = estado === 'uploading'
  const isProcessing = estado === 'processing'
  const isUploaded   = estado === 'uploaded'
  const isDone       = estado === 'done'
  const isError      = estado === 'error'

  return (
    <div className="carga-page">

      {/* ── Header ── */}
      <div className="carga-topbar">
        <h2>Módulo de carga masiva de usuarios plataforma</h2>
        <div className="carga-topbar-actions">
          <button className="btn-plantilla" onClick={descargarPlantilla}>
            Plantilla Básica <FileSpreadsheet size={15} />
          </button>
          <button className="btn-reiniciar" onClick={resetForm} disabled={estado === 'idle'}>
            Reiniciar <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="carga-divider" />

      {/* ── Cuerpo ── */}
      <div className="carga-body">

        {/* ── Columna izquierda: Instrucciones ── */}
        <div className="carga-instrucciones">
          <h5>Instrucciones</h5>
          <ol>
            <li>
              Descargar&nbsp;
              <button className="btn-plantilla-inline" onClick={descargarPlantilla}>
                Plantilla Básica <FileSpreadsheet size={13} />
              </button>
            </li>
            <li>Cargar la plantilla en la opción <b>CARGAR ARCHIVO</b></li>
            <li>Procesar archivo con la opción <b>PROCESAR ARCHIVO CARGADO</b></li>
            <li>
              Finalizado el proceso pueden surgir 2 escenarios:
              <ol type="1">
                <li><b>Hay errores:</b> Se genera un documento excel con los registros que contienen inconsistencias y no se pudieron guardar.</li>
                <li><b>No hay errores:</b> No se genera documento y sale un mensaje informando que todos los registros fueron exitosos.</li>
              </ol>
            </li>
          </ol>
          <p>
            <b>Nota:</b> Para cargar un nuevo archivo, usar la opción&nbsp;
            <button className="btn-reiniciar-inline" onClick={resetForm}>
              Reiniciar <RefreshCw size={13} />
            </button>
          </p>
        </div>

        <div className="carga-col-divider" />

        {/* ── Columna centro: Acciones ── */}
        <div className="carga-acciones">

          {/* Input oculto */}
          <input
            type="file"
            id="fileInput"
            accept=".xlsx"
            className="file-input-hidden"
            onChange={handleFileChange}
            disabled={isUploading || isProcessing}
          />

          {/* Botón cargar */}
          <label
            htmlFor="fileInput"
            className={`btn-accion btn-cargar ${isUploaded || isDone ? 'btn-accion-done' : ''}`}
          >
            <Upload size={22} />
            <span>{file ? file.name : 'CARGAR ARCHIVO'}</span>
          </label>

          {/* Botón procesar */}
          <button
            className="btn-accion btn-procesar"
            onClick={handleProcesar}
            disabled={!isUploaded || isProcessing}
          >
            <Settings size={20} className={isProcessing ? 'spin' : ''} />
            <span>{isProcessing ? 'PROCESANDO...' : 'PROCESAR ARCHIVO CARGADO'}</span>
          </button>

          {/* Botón subir (aparece cuando hay archivo seleccionado pero no subido) */}
          {file && estado === 'idle' && (
            <button className="btn-accion btn-upload-confirm" onClick={handleSubir} disabled={isUploading}>
              <Upload size={18} />
              <span>{isUploading ? 'SUBIENDO...' : 'CONFIRMAR CARGA'}</span>
            </button>
          )}

          {/* Resultado */}
          {isDone && resultado && (
            <div className={`carga-result ${resultado.errorCount > 0 ? 'result-warning' : 'result-success'}`}>
              <div className="result-row">
                <CheckCircle size={15} />
                <span><b>{resultado.successCount}</b> usuarios cargados correctamente</span>
              </div>
              {resultado.errorCount > 0 && (
                <div className="result-row">
                  <AlertCircle size={15} />
                  <span><b>{resultado.errorCount}</b> registros con errores</span>
                  <a className="btn-download" href={`${API_BASE}${resultado.errorFileUrl}`} download>
                    <Download size={12} /> Descargar
                  </a>
                </div>
              )}
            </div>
          )}

          {isError && (
            <div className="carga-result result-error">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="carga-col-divider" />

        {/* ── Columna derecha: Información ── */}
        <div className="carga-info">
          <h5>Información</h5>
          <p className="info-desc">
            <b>Plantilla básica:</b> Se utiliza para crear usuarios.
          </p>
          <button className="btn-ver-campos" onClick={() => setVerCampos(v => !v)}>
            VER DESCRIPCIÓN DE LOS CAMPOS <Info size={15} />
          </button>

          {verCampos && (
            <div className="campos-tabla">
              {CAMPOS.map(c => (
                <div key={c.col} className="campo-row">
                  <span className="campo-col">{c.col}</span>
                  <span className="campo-desc">{c.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}