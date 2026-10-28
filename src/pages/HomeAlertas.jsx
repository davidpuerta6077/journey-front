import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, ListTodo, PenLine, CalendarPlus, RefreshCw, Bell, CheckCircle2, ChevronRight } from 'lucide-react'
import { fetchMyTasks } from '../services/atom/fetchMyTasks'
import { getActividades } from '../services/onix/getActividades'
import { getRegistros } from '../services/onix/getRegistros'
import { fetchIndicadorUsuarios } from '../services/home/fetchIndicadorUsuarios'
import { fetchIndicadorCursos } from '../services/home/fetchIndicadorCursos'
import { fetchIndicadorMatriculas } from '../services/home/fetchIndicadorMatriculas'
import { fetchNotifications } from '../services/notifications/fetchNotifications'
import { generada } from './main/Informes/evidencias'
import { MESES, periodoActual } from './main/Informes/periodo'

const plural = (n, uno, varios) => `${n} ${Number(n) === 1 ? uno : varios}`
// Los títulos de notificación traen un emoji al inicio (ver la campana en SideNavMain)
const sinEmoji = (t = '') => t.replace(/^(\p{Extended_Pictographic})️?\s*/u, '')

// Alertas del Inicio: lo que necesita atención en cada sistema al que la persona tiene
// acceso (Atom, Onix-IA, Nexo) más las notificaciones del sistema sin leer. Cada fuente
// es independiente: si una falla o no aplica, simplemente no aparece.
export default function HomeAlertas({ conOnix, conNexo }) {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState(null) // null = cargando
  // '#atom' baja al bloque de Atom del mismo Inicio; lo demás navega a su sistema
  const abrir = (to) => {
    if (!to) return
    if (to === '#atom') document.querySelector('.hub-atom')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else navigate(to)
  }

  useEffect(() => {
    let activo = true
    const mes = MESES[periodoActual().mes - 1].toLowerCase()

    const atom = fetchMyTasks({}).then(({ counts: c = {} }) => ({ vencidas: Number(c.vencidas) || 0, pendientes: Number(c.pendientes) || 0 })).then((counts) => [
      counts.vencidas > 0 && { id: 'atom-vencidas', Icono: AlarmClock, tono: 'peligro', to: '#atom',
        titulo: plural(counts.vencidas, 'tarea vencida', 'tareas vencidas'), texto: 'En Atom. Revisa su fecha o ciérralas.' },
      counts.pendientes > 0 && { id: 'atom-pendientes', Icono: ListTodo, to: '#atom',
        titulo: plural(counts.pendientes, 'tarea pendiente', 'tareas pendientes'), texto: 'Asignadas a ti en Atom.' },
    ])

    const onix = !conOnix ? Promise.resolve([]) : Promise.all([getActividades(), getRegistros(periodoActual())])
      .then(([acts, regs]) => {
        if (!acts.length) return []
        if (!regs.length) {
          return [{ id: 'onix-vacio', Icono: CalendarPlus, to: '/informes',
            titulo: `Informe de ${mes} sin empezar`, texto: 'Registra en Onix-IA lo que hiciste este mes.' }]
        }
        const faltan = regs.filter((r) => !generada(r)).length
        return [faltan > 0 && { id: 'onix-faltan', Icono: PenLine, to: '/informes',
          titulo: `${plural(faltan, 'cosa', 'cosas')} sin redactar`, texto: `En tu informe de ${mes} (Onix-IA).` }]
      })

    const nexo = !conNexo ? Promise.resolve([]) : Promise.all([fetchIndicadorUsuarios(), fetchIndicadorCursos(), fetchIndicadorMatriculas()])
      .then(([u, c, m]) => {
        const total = u + c + m
        return [total > 0 && { id: 'nexo-sync', Icono: RefreshCw, to: '/HomeNexo',
          titulo: plural(total, 'proceso pendiente', 'procesos pendientes'),
          texto: `Por sincronizar en Nexo: ${u} usuarios, ${c} cursos, ${m} matrículas.` }]
      })

    // Las de Atom (tareas vencidas) ya salen arriba con su conteo: aquí solo las demás
    const avisos = fetchNotifications(10).then((lista) => lista
      .filter((n) => !n.read_at && !/atom|vencid/i.test(n.title || ''))
      .slice(0, 3)
      .map((n) => ({ id: `notif-${n.id}`, Icono: Bell, to: n.link || null, titulo: sinEmoji(n.title), texto: n.body || 'Notificación del sistema' })))

    Promise.allSettled([atom, onix, nexo, avisos]).then((res) => {
      if (!activo) return
      setAlertas(res.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).filter(Boolean))
    })
    return () => { activo = false }
  }, [conOnix, conNexo])

  return (
    <aside className="hub-alerts">
      <h2 className="hub-title">Alertas y notificaciones</h2>
      {alertas === null ? (
        <p className="hub-alert-vacio">Revisando tus sistemas...</p>
      ) : alertas.length === 0 ? (
        <p className="hub-alert-vacio"><CheckCircle2 size={18} aria-hidden="true" /> Todo al día. No hay nada pendiente.</p>
      ) : (
        <ul className="hub-alert-list">
          {alertas.map(({ id, Icono, tono, to, titulo, texto }) => (
            <li key={id}>
              <button type="button" className={`hub-alert-item${tono ? ` ${tono}` : ''}`} disabled={!to} onClick={() => abrir(to)}>
                <span className="hub-alert-icon"><Icono size={18} /></span>
                <span className="hub-alert-texto">
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </span>
                {to && <ChevronRight size={16} aria-hidden="true" className="hub-alert-flecha" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
