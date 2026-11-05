import { Users } from 'lucide-react'
import CargaMasiva from '../../../components/CargaMasiva'
import { uploadExcel } from '../../../services/carga/uploadExcel'
import { processExcel } from '../../../services/carga/processExcel'

const CAMPOS = [
  { col: 'name',      desc: 'Nombre del usuario' },
  { col: 'last_name', desc: 'Apellido del usuario' },
  { col: 'document',  desc: 'Número de documento (se usa como contraseña inicial)' },
  { col: 'email',     desc: 'Correo institucional (se usa como username)' },
]

export default function CargaUsuarios() {
  return (
    <CargaMasiva
      titulo="Carga Masiva de Usuarios"
      descripcion="Carga y procesa múltiples usuarios mediante un archivo Excel."
      icono={Users}
      plantillas={[{
        nombre: 'Plantilla básica',
        descripcion: 'Se utiliza para crear usuarios.',
        archivo: 'plantilla_usuarios.xlsx',
        filas: [CAMPOS.map(c => c.col)],
        campos: CAMPOS,
      }]}
      subir={uploadExcel}
      procesar={processExcel}
    />
  )
}
