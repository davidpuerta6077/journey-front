import { useEffect, useState } from 'react'
import { CalendarDays, Unplug } from 'lucide-react'
import { getGoogleEstado } from '../../../services/onix/getGoogleEstado'
import { getGoogleUrl } from '../../../services/onix/getGoogleUrl'
import { desconectarGoogle } from '../../../services/onix/desconectarGoogle'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'

// Conexión de la cuenta de Google de cada usuario (solo lectura del calendario
// y del asunto/destinatarios de los correos enviados), para traer reuniones,
// eventos y correos del mes como subactividades.
export default function GoogleCuenta() {
  const [estado, setEstado] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    getGoogleEstado().then(setEstado).catch((e) => { alertError(e.message); setEstado({ configurado: false }) })
  }, [])

  const conectar = async () => {
    setOcupado(true)
    try {
      window.location.assign((await getGoogleUrl()).url)
    } catch (e) {
      alertError(e.message)
      setOcupado(false)
    }
  }

  const desconectar = async () => {
    if (!(await confirmAccion({
      title: '¿Desconectar Google?',
      text: 'Bravo Hub dejará de leer tu calendario y tus correos enviados. Lo que ya agregaste a tus subactividades se conserva.',
      confirmButtonText: 'Sí, desconectar',
    }))) return
    setOcupado(true)
    try {
      await desconectarGoogle()
      setEstado({ ...estado, conectado: false, email: null })
      toastExito('Cuenta de Google desconectada')
    } catch (e) {
      alertError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="onix-redactar onix-google">
      <span className="onix-fuente-icono" aria-hidden="true"><CalendarDays size={20} /></span>
      <div className="onix-google-texto">
        {estado === null ? 'Cargando...' : !estado.configurado ? (
          <span>La conexión con Google aún no está configurada en el servidor. Pídela al administrador de Bravo Hub.</span>
        ) : estado.conectado ? (
          <>
            <strong>Conectado como {estado.email}</strong>
            <span>Dentro de cada actividad, en "Agrega lo que hiciste", usa "Google Calendar" o "Correos enviados". Si los correos piden permiso, desconecta y vuelve a conectar.</span>
          </>
        ) : (
          <>
            <strong>Conecta tu cuenta de Google</strong>
            <span>Así puedes traer tus reuniones, eventos y correos enviados del mes como subactividades. Bravo Hub solo lee tu calendario y el asunto, destinatarios y fecha de tus correos enviados (nunca su contenido); no crea, envía ni cambia nada.</span>
          </>
        )}
      </div>
      {estado?.configurado && (estado.conectado ? (
        <button className="btn-secondary" disabled={ocupado} onClick={desconectar}><Unplug size={16} /> Desconectar</button>
      ) : (
        <button className="btn-primary" disabled={ocupado} onClick={conectar}><CalendarDays size={16} /> {ocupado ? 'Abriendo Google...' : 'Conectar con Google'}</button>
      ))}
    </div>
  )
}
