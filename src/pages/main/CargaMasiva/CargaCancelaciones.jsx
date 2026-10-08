import { useState, useCallback } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertCircle, Download, Info, FileSpreadsheet, Settings } from 'lucide-react'
import * as XLSX from 'xlsx'
import { uploadExcelNovedades } from '../../../services/carga/uploadExcelNovedades'
import { processExcelNovedades } from '../../../services/carga/processExcelNovedades'
import "../../../styles/main/CargaMasiva/CargaUsuarios.css";

const API_BASE = import.meta.env.VITE_URL_BASE

const CAMPOS = [
  { col: 'code',  desc: 'Código del curso (idnumber / código journey) ya existente en el sistema' },
  { col: 'email', desc: 'Correo del estudiante a cancelar — debe existir y estar sincronizado con Moodle' },
]

export default function CargaCancelaciones() {
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
    const ws = XLSX.utils.aoa_to_sheet([['code', 'email']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, 'plantilla_cancelaciones.xlsx')
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
      const path = await uploadExcelNovedades(file)
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
      const result = await processExcelNovedades(filePath)
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
        <h2>Módulo de cancelación masiva de matrículas</h2>
        <div className="carga-topbar-actions">
          <button className="btn-plantilla" onClick={descargarPlantilla}>
            Plantilla <FileSpreadsheet size={15} />
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
              Descargar la&nbsp;
              <button className="btn-plantilla-inline" onClick={descargarPlantilla}>
                Plantilla <FileSpreadsheet size={13} />
              </button>
              &nbsp;con el curso (code) y el email del estudiante a cancelar.
            </li>
            <li>Cargar la plantilla en la opción <b>CARGAR ARCHIVO</b></li>
            <li>Procesar archivo con la opción <b>PROCESAR ARCHIVO CARGADO</b></li>
            <li>
              Finalizado el proceso pueden surgir 2 escenarios:
              <ol type="1">
                <li><b>Hay errores:</b> Se genera un documento excel con los registros que contienen inconsistencias y no se pudieron procesar.</li>
                <li><b>No hay errores:</b> No se genera documento y sale un mensaje informando que todos los registros fueron exitosos.</li>
              </ol>
            </li>
          </ol>
          <p>
            <b>Nota:</b> La matrícula pasa a <b>Cancelado</b> (equivalente a Suspended en Moodle): Moodle desmatriculará al estudiante en su próxima sincronización. Para cargar un nuevo archivo, usar la opción&nbsp;
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
            id="fileInputCancelaciones"
            accept=".xlsx"
            className="file-input-hidden"
            onChange={handleFileChange}
            disabled={isUploading || isProcessing}
          />

          {/* Botón cargar */}
          <label
            htmlFor="fileInputCancelaciones"
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
                <span><b>{resultado.successCount}</b> matrículas canceladas correctamente</span>
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
            La cancelación masiva pasa el estado de la matrícula a <b>Cancelado</b> (equivalente a Suspended en Moodle), igual que elegir "Cancelado" en el Módulo de Matrículas. El estudiante y el curso deben existir y estar sincronizados previamente.
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
