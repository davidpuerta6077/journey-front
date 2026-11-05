import { BookOpen, Database, PlusCircle, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import CargaMasiva from '../../../components/CargaMasiva'
import { uploadExcelCursos } from '../../../services/carga/uploadExcelCursos'
import { processExcelCursos } from '../../../services/carga/processExcelCursos'

const COLUMNAS = [
  'nombre_corto_moodle', 'codigo_asignatura', 'nombre_asignatura', 'periodo', 'grupo',
  'programa', 'departamento', 'profesor', 'documento_profesor', 'correo_profesor',
  'fecha_inicio', 'fecha_fin',
]

const CAMPOS = [
  { col: 'nombre_corto_moodle', desc: 'Solo para MIGRAR: nombre corto del curso que ya existe en Moodle. Si lo llenas, no se crea copia: se registra en Nexo apuntando a ese curso.' },
  { col: 'codigo_asignatura', desc: 'Código de la asignatura (ej. MTG017). Obligatorio para crear.' },
  { col: 'nombre_asignatura', desc: 'Nombre de la asignatura. Obligatorio para crear.' },
  { col: 'periodo', desc: 'Periodo académico (ej. 20271). Obligatorio para crear.' },
  { col: 'grupo', desc: 'Grupo (ej. 100 o G100). Obligatorio para crear.' },
  { col: 'programa / departamento', desc: 'Opcionales.' },
  { col: 'profesor', desc: 'Nombre completo del profesor (opcional; va en el nombre del curso nuevo).' },
  { col: 'documento_profesor / correo_profesor', desc: 'Opcionales.' },
  { col: 'fecha_inicio / fecha_fin', desc: 'Opcionales, AAAA-MM-DD o DD/MM/AAAA. En un curso migrado, si van vacías se toman de Moodle.' },
]

export default function CargaCursos() {
  return (
    <CargaMasiva
      titulo="Carga Masiva de Cursos"
      descripcion="Crea cursos nuevos o migra a Nexo los que ya existen en Moodle, mediante un archivo Excel."
      icono={BookOpen}
      accept=".xlsx"
      plantillas={[{
        nombre: 'Plantilla de cursos',
        descripcion: 'Una fila por curso. Trae un ejemplo de migrar y uno de crear; bórralos antes de cargar.',
        archivo: 'plantilla_cursos.xlsx',
        filas: [
          COLUMNAS,
          ['NOMBRE-CORTO-EN-MOODLE', '', '', '', '', '', '', '', '', '', '', ''],
          ['', 'MTG017', 'Maternidad de Gallinas', '20271', '100', 'Tecnología Agropecuaria', '', 'Nombre Apellido', '1000000000', 'profesor@pascualbravo.edu.co', '2027-02-01', '2027-06-15'],
        ],
        campos: CAMPOS,
      }]}
      nota={<>
        <b>Migrar:</b> llena <b>nombre_corto_moodle</b>. Se busca en Moodle por nombre corto y se matricula por su idnumber; si no tiene idnumber, Nexo le asigna código + periodo + grupo. Queda listo para Carga Masiva &gt; Matrículas.<br /><br />
        <b>Crear:</b> deja vacío nombre_corto_moodle. Queda pendiente con el formato de SICAU y se crea en Moodle desde Sincronización &gt; Cursos. Si ya existe en Moodle uno con ese código + periodo + grupo, se vincula en vez de duplicarlo.
      </>}
      subir={uploadExcelCursos}
      procesar={processExcelCursos}
      resumen={(r) => [
        { label: 'Registros procesados', valor: (r.creados || 0) + (r.migrados || 0) + (r.errorCount || 0), tono: 'marca', icono: Database },
        { label: 'Cursos creados', valor: r.creados || 0, tono: 'ok', icono: PlusCircle },
        { label: 'Cursos migrados', valor: r.migrados || 0, tono: 'info', icono: ArrowRightLeft },
        { label: 'Registros con errores', valor: r.errorCount || 0, tono: 'error', icono: AlertTriangle },
      ]}
    />
  )
}
