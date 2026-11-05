import { GraduationCap } from 'lucide-react'
import CargaMasiva from '../../../components/CargaMasiva'
import { uploadExcelMatriculas } from '../../../services/carga/uploadExcelMatriculas'
import { processExcelMatriculas } from '../../../services/carga/processExcelMatriculas'

const CAMPOS_BASICA = [
  { col: 'code',   desc: 'Código del curso (idnumber) ya existente en Nexo' },
  { col: 'email',  desc: 'Correo del estudiante: debe existir un usuario con ese email' },
  { col: 'rol',    desc: 'gestor, editingteacher, teacher, student o revisor' },
  { col: 'state',  desc: 'Estado numérico: 1 = Matriculado, cualquier otro = Pendiente' },
  { col: 'period', desc: 'Periodo académico' },
]

const CAMPOS_EXTENDIDA = [
  ...CAMPOS_BASICA,
  { col: 'name',                desc: 'Nombre del estudiante (si no existe, se crea el usuario)' },
  { col: 'last_name',           desc: 'Apellido del estudiante' },
  { col: 'document',            desc: 'Documento (se usa como contraseña inicial)' },
  { col: 'personalMail',        desc: 'Correo personal (opcional)' },
  { col: 'phone',               desc: 'Teléfono (opcional)' },
  { col: 'cellPhone',           desc: 'Celular (opcional)' },
  { col: 'Fecha_de_Nacimiento', desc: 'Fecha de nacimiento (opcional)' },
  { col: 'jornada',             desc: 'Jornada (opcional)' },
  { col: 'departamento',        desc: 'Departamento académico (opcional)' },
  { col: 'plan_estudios',       desc: 'Plan de estudios (opcional)' },
]

export default function CargaMatriculas() {
  return (
    <CargaMasiva
      titulo="Carga Masiva de Matrículas"
      descripcion="Matricula múltiples estudiantes en sus cursos mediante un archivo Excel."
      icono={GraduationCap}
      plantillas={[
        {
          nombre: 'Plantilla básica',
          descripcion: 'Matricula estudiantes que ya existen (los busca por email).',
          archivo: 'plantilla_matriculas_basica.xlsx',
          filas: [CAMPOS_BASICA.map(c => c.col)],
          campos: CAMPOS_BASICA,
        },
        {
          nombre: 'Plantilla extendida',
          descripcion: 'Además crea el estudiante si el email no existe.',
          archivo: 'plantilla_matriculas_extendida.xlsx',
          filas: [CAMPOS_EXTENDIDA.map(c => c.col)],
          campos: CAMPOS_EXTENDIDA,
        },
      ]}
      nota={<>Para cursos migrados desde Moodle, la columna <b>code</b> es el idnumber del curso (se ve en Módulos &gt; Cursos).</>}
      subir={uploadExcelMatriculas}
      procesar={processExcelMatriculas}
    />
  )
}
