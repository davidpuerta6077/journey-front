import PerfilTab from './PerfilTab'
import ActividadesTab from './ActividadesTab'
import GoogleCuenta from './GoogleCuenta'

// Lo que se configura una vez: datos del contratista, actividades del contrato
// y la cuenta de Google para traer eventos del calendario y correos.
export default function ConfiguracionTab({ perfil, onPerfilGuardado }) {
  return (
    <div className="onix-mes onix-config">
      <section className="onix-seccion" aria-labelledby="config-perfil">
        <h4 id="config-perfil">Tus datos</h4>
        <p className="onix-seccion-ayuda">Aparecen en el Word de cada informe. Se llenan una sola vez.</p>
        <PerfilTab perfil={perfil} onSaved={onPerfilGuardado} />
      </section>
      <ActividadesTab />
      <section className="onix-seccion" aria-labelledby="config-google">
        <h4 id="config-google">Cuenta de Google</h4>
        <p className="onix-seccion-ayuda">Para traer a tus actividades las reuniones de tu calendario y los correos que enviaste.</p>
        <GoogleCuenta />
      </section>
    </div>
  )
}
