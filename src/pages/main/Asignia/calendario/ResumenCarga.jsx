import { fmtHoras, fechaCorta } from './calendarioUtil'

// Carga académica del profesor: horas por semana y del semestre, y sesiones que
// se pierden por festivos o semanas sin clase (para planear reposiciones).
export default function ResumenCarga({ carga, semestre }) {
  if (!carga) return null
  const conSemestre = carga.horasSemestre !== null
  return (
    <section className="cal-carga" aria-label="Carga académica">
      <div className="cal-carga-cifras">
        <div><span className="cal-carga-num">{fmtHoras(carga.horasSemana)}</span><span>por semana</span></div>
        <div><span className="cal-carga-num">{fmtHoras(carga.horasSemestre)}</span><span>en el semestre</span></div>
        <div><span className="cal-carga-num">{carga.sesionesSemestre ?? '—'}</span><span>sesiones a dictar</span></div>
        <div className={carga.sesionesPerdidas ? 'cal-carga-alerta' : ''}><span className="cal-carga-num">{carga.sesionesPerdidas ?? '—'}</span><span>sesiones perdidas</span></div>
      </div>
      {!conSemestre && <p className="asignia-ayuda">Las horas del semestre y las sesiones perdidas por festivos se calculan cuando estén configuradas las fechas del semestre.</p>}
      {carga.porAsignatura.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table cal-carga-tabla">
            <thead>
              <tr>
                <th>Asignatura</th><th>H/semana</th>
                {conSemestre && <><th>Sesiones</th><th>H semestre</th><th>Perdidas</th></>}
              </tr>
            </thead>
            <tbody>
              {carga.porAsignatura.map(a => (
                <tr key={a.curso_id}>
                  <td data-label="Asignatura">{a.codigo} · {a.curso} <span className="asignia-dato">G{a.grupo || '—'}</span></td>
                  <td data-label="H/semana">{fmtHoras(a.horasSemana)}</td>
                  {conSemestre && (
                    <>
                      <td data-label="Sesiones">{a.sesionesSemestre}</td>
                      <td data-label="H semestre">{fmtHoras(a.horasSemestre)}</td>
                      <td data-label="Perdidas">
                        {a.sesionesPerdidas ? (
                          <div className="asignia-celda">
                            <span>{a.sesionesPerdidas}</span>
                            {a.perdidas.map(p => <span key={`${p.fecha}${p.inicio}`} className="asignia-dato">{fechaCorta(p.fecha)} {p.inicio} · {p.motivo}</span>)}
                          </div>
                        ) : '0'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {semestre && <p className="asignia-dato">Semestre del {fechaCorta(semestre.fecha_inicio)} al {fechaCorta(semestre.fecha_fin)} de {semestre.fecha_fin.slice(0, 4)}.</p>}
    </section>
  )
}
