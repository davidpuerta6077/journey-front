import { AlertTriangle } from 'lucide-react'
import { ESTADOS } from '../asigniaUtil'
import { TIPO_CRUCE } from './calendarioUtil'

// Detalle completo de una sesión del calendario y sus cruces.
export default function DetalleSesionModal({ s, cruces = [], sesionesPorId, onClose }) {
  const otra = (c) => sesionesPorId.get(c.sesiones.find(id => id !== s.id))
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="cal-detalle-titulo">
        <div className="modal-header">
          <h3 id="cal-detalle-titulo">{s.curso}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form">
          <dl className="asignia-ficha-datos">
            <div><dt>Código</dt><dd>{s.codigo}</dd></div>
            <div><dt>Grupo</dt><dd>{s.grupo || '—'}</dd></div>
            <div><dt>Horario</dt><dd>{s.dia} {s.inicio}–{s.fin}</dd></div>
            <div><dt>Aula</dt><dd>{s.aula || '—'}</dd></div>
            <div className="asignia-ficha-ancho"><dt>Programa</dt><dd>{s.programa || '—'}</dd></div>
            <div><dt>Plan / nivel</dt><dd>{s.plan || '—'} / {s.nivel || '—'}</dd></div>
            <div><dt>Jornada</dt><dd>{s.jornada || '—'}</dd></div>
            <div className="asignia-ficha-ancho"><dt>Sede</dt><dd>{s.sede || '—'}</dd></div>
            <div><dt>Modalidad</dt><dd>{s.modalidad}{s.espacio ? ` · ${s.espacio}` : ''}</dd></div>
            <div><dt>H. semana</dt><dd>{s.horas_semana || '—'}</dd></div>
            <div className="asignia-ficha-ancho"><dt>Profesor</dt><dd>{s.profesor_nombre || '—'}</dd></div>
            <div className="asignia-ficha-ancho">
              <dt>Estado</dt>
              <dd>{s.tentativa ? 'Postulación en revisión' : (ESTADOS[s.verificacion]?.label || s.verificacion)}</dd>
            </div>
          </dl>
          {cruces.length > 0 && (
            <section aria-label="Cruces">
              <h4 className="modal-section-title cal-detalle-cruces-titulo"><AlertTriangle size={15} aria-hidden="true" /> {cruces.length} cruce{cruces.length > 1 ? 's' : ''}</h4>
              <ul className="asignia-lista-confirmar">
                {cruces.map(c => {
                  const o = otra(c)
                  return (
                    <li key={c.id}>
                      <strong>{TIPO_CRUCE[c.tipo]} · {c.dia} {c.inicio}–{c.fin}</strong>
                      <span>Con {o ? `${o.codigo} ${o.curso} (G${o.grupo || '—'}), ${o.inicio}–${o.fin}${o.aula ? `, aula ${o.aula}` : ''}${o.profesor_nombre ? `, ${o.profesor_nombre}` : ''}` : 'otro curso'}{c.tipo !== 'profesor' ? ` · ${c.etiqueta}` : ''}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
