import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, History, FileDown } from 'lucide-react'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError } from '../../../services/alerts'
import SubactividadCard from './SubactividadCard'
import SubactividadForm from './SubactividadForm'
import TraerLogsModal from './TraerLogsModal'
import { generada } from './evidencias'
import { MESES } from './periodo'

export default function ActividadMes({
  actividad, numero, registros, periodo, abierta, onToggle, onCambio, onActualizado,
  perfilCompleto, soloLectura = false, bloqueado = false,
}) {
  const [form, setForm] = useState(null) // null | 'nueva' | registro en edición
  const [traerLogs, setTraerLogs] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const generadas = registros.filter(generada).length
  const evidencias = registros.reduce((n, r) => n + r.evidencias.length, 0)
  const lista = registros.length > 0 && registros.every((r) => r.parrafo)

  const descargar = async () => {
    setDescargando(true)
    try {
      await descargarArchivo(`/actividades/${actividad.id}/documento-word`, periodo,
        `Evidencia_${MESES[periodo.mes - 1]}_actividad_${numero}.docx`)
    } catch (e) {
      alertError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="onix-card onix-act-mes">
      <button type="button" className="onix-act-head" aria-expanded={abierta} onClick={onToggle}>
        {abierta ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
        <span className="onix-act-nombre"><span className="onix-num">Actividad {numero}</span>{actividad.nombre}</span>
        <span className="onix-chips">
          <span className={`onix-chip${registros.length ? ' ok' : ''}`}>{registros.length} subactividad(es)</span>
          <span className={`onix-chip${evidencias ? ' ok' : ''}`}>{evidencias} evidencia(s)</span>
          <span className={`onix-chip${registros.length && generadas === registros.length ? ' ok' : ''}`}>{generadas} generada(s)</span>
        </span>
      </button>

      {abierta && (
        <div className="onix-act-body">
          <p className="onix-act-desc">{actividad.descripcion}</p>

          {registros.length === 0 && form !== 'nueva' && (
            <p className="onix-vacio">
              {soloLectura ? 'Sin subactividades este mes.' : 'Aún no hay subactividades este mes. Agrega cada cosa que hiciste para esta actividad.'}
            </p>
          )}

          {registros.map((r) => (form?.id === r.id
            ? <SubactividadForm key={r.id} actividadId={actividad.id} periodo={periodo} registro={r}
                onGuardado={() => { setForm(null); onCambio() }} onCancelar={() => setForm(null)} />
            : <SubactividadCard key={r.id} registro={r} soloLectura={soloLectura} perfilCompleto={perfilCompleto} bloqueado={bloqueado}
                onEditar={() => setForm(r)} onCambio={onCambio} onActualizado={onActualizado} />))}

          {form === 'nueva' && (
            <SubactividadForm actividadId={actividad.id} periodo={periodo}
              onGuardado={() => { setForm(null); onCambio() }} onCancelar={() => setForm(null)} />
          )}

          <div className="onix-acciones">
            {!soloLectura && form !== 'nueva' && (
              <>
                <button className="btn-primary" onClick={() => setForm('nueva')}><Plus size={16} /> Nueva subactividad</button>
                <button className="btn-secondary" onClick={() => setTraerLogs(true)}><History size={16} /> Traer de mis acciones</button>
              </>
            )}
            <button className="btn-secondary onix-acciones-der" disabled={!lista || descargando || bloqueado} onClick={descargar}
              title={!lista ? 'Todas las subactividades deben estar generadas con IA' : undefined}>
              <FileDown size={16} /> {descargando ? 'Descargando...' : 'Documento de la actividad (Word)'}
            </button>
          </div>
        </div>
      )}

      {traerLogs && (
        <TraerLogsModal actividad={actividad} periodo={periodo} onClose={() => setTraerLogs(false)}
          onAgregado={() => { setTraerLogs(false); onCambio() }} />
      )}
    </div>
  )
}
