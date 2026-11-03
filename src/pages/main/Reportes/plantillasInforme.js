import { AlertTriangle, UserX, Clock, PieChart, Users, BookOpen, CloudOff, Bell, Contact, Wrench, GraduationCap } from 'lucide-react'

// Puntos de partida del constructor: una pregunta en lenguaje sencillo y los
// params ya armados. El usuario elige una, ajusta con los filtros rápidos y
// guarda; "Personalizar" abre el panel avanzado con estos mismos params.
// vista.sustantivo = cómo se llaman las filas en las cifras ("estudiantes").
// agrupar = columnas de los gráficos (hasta 2).

// Población base de los informes de estudiantes: matrículas vigentes del periodo más reciente.
const BASE = [
  { col: 'e_role', op: 'eq', valor: 'Estudiante' },
  { col: 'e_estado', op: 'neq', valor: 'Cancelado' },
  { col: 'e_estado', op: 'neq', valor: 'Desmatriculado' },
  { col: 'e_periodo', op: 'periodo_actual' },
]
const ESTUDIANTE = ['u_nombre_completo', 'u_documento', 'u_email', 'u_celular', 'e_nombre_asignatura', 'e_programa', 'e_grupo', 'c_nombre_profesor', 'e_periodo']

export const PLANTILLAS = [
  {
    id: 'riesgo', icono: AlertTriangle, titulo: 'Estudiantes en riesgo',
    pregunta: '¿Qué estudiantes van mal y por qué?',
    descripcion: 'Cruza accesos, notas, entregas y avance de Moodle. Los criterios se pueden ajustar.',
    params: {
      dataset: 'matriculas',
      columnas: ['u_nombre_completo', 'riesgo_nivel', 'riesgo_criterios', 'e_nombre_asignatura', 'e_programa', 'm_dias_sin_entrar_curso', 'm_calificacion', 'm_entregas_vencidas', 'm_avance', 'u_documento', 'u_email', 'u_celular', 'c_nombre_profesor'],
      filtros: [...BASE, { col: 'riesgo_nivel', op: 'neq', valor: 'Sin riesgo' }],
      agrupar: ['riesgo_nivel', 'e_programa'],
      vista: { sustantivo: 'estudiantes en riesgo' },
    },
  },
  {
    id: 'nunca-entraron', icono: UserX, titulo: 'Nunca entraron al curso',
    pregunta: '¿Quién no ha entrado ni una vez a su curso?',
    descripcion: 'Estudiantes matriculados del periodo actual sin ningún acceso al curso en Moodle.',
    params: {
      dataset: 'matriculas',
      columnas: [...ESTUDIANTE, 'm_ultimo_acceso_plataforma'],
      filtros: [...BASE, { col: 'm_nunca_entro_curso', op: 'eq', valor: true }],
      agrupar: ['e_programa', 'e_nombre_asignatura'],
      vista: { sustantivo: 'estudiantes' },
    },
  },
  {
    id: 'sin-entrar', icono: Clock, titulo: 'Sin entrar hace más de 7 días',
    pregunta: '¿Quién dejó de entrar al curso?',
    descripcion: 'Entraron alguna vez pero llevan más de 7 días sin volver.',
    params: {
      dataset: 'matriculas',
      columnas: ['u_nombre_completo', 'm_dias_sin_entrar_curso', 'm_ultimo_acceso_curso', ...ESTUDIANTE.slice(1)],
      filtros: [...BASE, { col: 'm_dias_sin_entrar_curso', op: 'gt', valor: 7 }],
      agrupar: ['e_programa', 'e_nombre_asignatura'],
      vista: { sustantivo: 'estudiantes' },
    },
  },
  {
    id: 'matriculas-programa', icono: PieChart, titulo: 'Matrículas por programa',
    pregunta: '¿Cuántos estudiantes hay por programa y asignatura?',
    descripcion: 'Conteo de matrículas vigentes del periodo actual, solo con datos de Nexo (carga rápida).',
    params: {
      dataset: 'matriculas',
      columnas: ['e_programa', 'e_nombre_asignatura', 'e_grupo', 'u_nombre_completo', 'u_documento', 'u_jornada', 'e_estado', 'e_periodo'],
      filtros: BASE,
      agrupar: ['e_programa', 'u_jornada'],
      vista: { sustantivo: 'matrículas' },
    },
  },
  {
    id: 'listado-curso', icono: GraduationCap, titulo: 'Listado de estudiantes por curso',
    pregunta: '¿Quiénes están en cada curso?',
    descripcion: 'Lista de clase con contacto del estudiante. Filtra por asignatura y grupo.',
    params: {
      dataset: 'matriculas',
      columnas: ['e_nombre_asignatura', 'e_grupo', 'u_nombre_completo', 'u_documento', 'u_email', 'u_correo_personal', 'u_celular', 'c_nombre_profesor'],
      filtros: BASE,
      agrupar: ['e_nombre_asignatura'],
      vista: { sustantivo: 'estudiantes' },
    },
  },
  {
    id: 'no-en-moodle', icono: CloudOff, titulo: 'Matriculados que no aparecen en Moodle',
    pregunta: '¿Qué matrículas de Nexo no llegaron a Moodle?',
    descripcion: 'Matrículas vigentes que Moodle todavía no tiene aplicadas.',
    params: {
      dataset: 'matriculas',
      columnas: ['u_nombre_completo', 'u_documento', 'e_nombre_asignatura', 'e_grupo', 'e_programa', 'e_sincronizado', 'e_estado_sync', 'm_en_moodle'],
      filtros: [...BASE, { col: 'm_matricula_en_moodle', op: 'eq', valor: false }],
      agrupar: ['e_sincronizado', 'e_programa'],
      vista: { sustantivo: 'matrículas' },
    },
  },
  {
    id: 'cursos', icono: BookOpen, titulo: 'Cursos y profesores',
    pregunta: '¿Qué cursos hay y quién los dicta?',
    descripcion: 'Cursos del periodo con profesor, fechas y estado de sincronización.',
    params: {
      dataset: 'cursos',
      columnas: ['c_nombre_asignatura', 'c_grupo', 'c_nombre_profesor', 'c_correo_institucional', 'c_departamento', 'c_fecha_inicio', 'c_fecha_fin', 'c_estado_sync', 'c_periodo'],
      filtros: [{ col: 'c_periodo', op: 'periodo_actual' }],
      agrupar: ['c_departamento', 'c_estado_sync'],
      vista: { sustantivo: 'cursos' },
    },
  },
  {
    id: 'cursos-error', icono: Wrench, titulo: 'Cursos con error de sincronización',
    pregunta: '¿Qué cursos no se pudieron crear en Moodle?',
    descripcion: 'Cursos con error al sincronizar y el mensaje del error.',
    params: {
      dataset: 'cursos',
      columnas: ['c_nombre_asignatura', 'c_grupo', 'c_nombre_profesor', 'c_ultimo_error_sync', 'c_synced_at', 'c_periodo'],
      filtros: [{ col: 'c_estado_sync', op: 'eq', valor: 'error' }],
      agrupar: ['c_periodo'],
      vista: { sustantivo: 'cursos con error' },
    },
  },
  {
    id: 'novedades', icono: Bell, titulo: 'Novedades de SICAU',
    pregunta: '¿Qué cambios llegaron desde SICAU?',
    descripcion: 'Matrículas nuevas, retiros, cambios de grupo y de profesor del periodo actual.',
    params: {
      dataset: 'novedades',
      columnas: ['n_fecha', 'n_nivel', 'n_tipo', 'n_motivo', 'n_nombre_asignatura', 'n_grupo', 'n_cedula', 'n_cambios', 'n_usuario_sicau', 'n_periodo'],
      filtros: [{ col: 'n_periodo', op: 'periodo_actual' }],
      agrupar: ['n_tipo', 'n_nivel'],
      vista: { sustantivo: 'novedades' },
    },
  },
  {
    id: 'sin-celular', icono: Contact, titulo: 'Estudiantes sin celular registrado',
    pregunta: '¿A quién no podemos llamar?',
    descripcion: 'Usuarios sin número de celular en Nexo.',
    params: {
      dataset: 'usuarios',
      columnas: ['u_nombre_completo', 'u_documento', 'u_email', 'u_correo_personal', 'u_telefono', 'u_jornada', 'u_plan_estudios'],
      filtros: [{ col: 'u_celular', op: 'empty' }],
      agrupar: ['u_jornada'],
      vista: { sustantivo: 'usuarios' },
    },
  },
  {
    id: 'usuarios', icono: Users, titulo: 'Usuarios por jornada y estado',
    pregunta: '¿Cuántos usuarios hay y en qué estado?',
    descripcion: 'Todos los usuarios de Nexo con su jornada, plan de estudios y estado.',
    params: {
      dataset: 'usuarios',
      columnas: ['u_nombre_completo', 'u_documento', 'u_email', 'u_jornada', 'u_plan_estudios', 'u_estado', 'u_sincronizado'],
      filtros: [],
      agrupar: ['u_jornada', 'u_estado'],
      vista: { sustantivo: 'usuarios' },
    },
  },
]
