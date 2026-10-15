import PerfilTab from './PerfilTab'
import ActividadesTab from './ActividadesTab'

// Lo que se configura una vez: datos del contratista y actividades del contrato.
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
    </div>
  )
}
