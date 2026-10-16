import PerfilTab from './PerfilTab'
import ActividadesTab from './ActividadesTab'
import GoogleCuenta from './GoogleCuenta'

// Lo que se configura una vez: datos del contratista, actividades del contrato
// y la cuenta de Google para traer eventos del calendario.
export default function ConfiguracionTab({ perfil, onPerfilGuardado }) {
  return (
    <div className="onix-config">
      <section>
        <h3 className="onix-config-titulo">Mi perfil</h3>
        <PerfilTab perfil={perfil} onSaved={onPerfilGuardado} />
      </section>
      <section>
        <ActividadesTab />
      </section>
      <section>
        <h3 className="onix-config-titulo">Google Calendar</h3>
        <GoogleCuenta />
      </section>
    </div>
  )
}
