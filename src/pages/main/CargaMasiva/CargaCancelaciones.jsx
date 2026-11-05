import { UserX } from 'lucide-react'
import CargaMasiva from '../../../components/CargaMasiva'
import { uploadExcelNovedades } from '../../../services/carga/uploadExcelNovedades'
import { processExcelNovedades } from '../../../services/carga/processExcelNovedades'

const CAMPOS = [
  { col: 'code',  desc: 'Código del curso (idnumber / código journey) ya existente en el sistema' },
  { col: 'email', desc: 'Correo del estudiante a cancelar: debe existir y estar sincronizado con Moodle' },
]

export default function CargaCancelaciones() {
  return (
    <CargaMasiva
      titulo="Carga Masiva de Cancelaciones"
      descripcion="Cancela matrículas de varios estudiantes a la vez mediante un archivo Excel."
      icono={UserX}
      plantillas={[{
        nombre: 'Plantilla de cancelaciones',
        descripcion: 'Pasa la matrícula a Cancelado (equivalente a Suspended en Moodle).',
        archivo: 'plantilla_cancelaciones.xlsx',
        filas: [CAMPOS.map(c => c.col)],
        campos: CAMPOS,
      }]}
      nota={<>Igual que elegir <b>Cancelado</b> en el Módulo de Matrículas: Moodle desmatricula al estudiante en su próxima sincronización. El estudiante y el curso deben existir y estar sincronizados.</>}
      subir={uploadExcelNovedades}
      procesar={processExcelNovedades}
    />
  )
}
