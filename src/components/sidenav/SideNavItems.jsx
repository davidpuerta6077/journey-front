import {
  RefreshCw, BookOpen, FileText,
  Activity, Upload, Shield, Globe, BarChart2, Settings,
  Search, ClipboardList, FlaskConical, History,
  Users, GraduationCap, UserX, Bell, LayoutGrid, ListChecks, LayoutTemplate, Database, Server
} from 'lucide-react'

// Iconos de marca "Bravo Hub" (mockup): el sidebar tiene fondo navy fijo
// siempre (ver --menu-bg en Layout.css, no reacciona al tema claro/oscuro
// de la app), así que acá se usa siempre el set "Para fondo oscuros" -mismo
// criterio que el logo del nav, que sí cambia con el tema porque el nav sí
// cambia de fondo-. Los items sin asset provisto (Monitoreo, Laboratorios
// Virtuales, Formularios de Asistencia, Ver Logs, Integración, Reportes,
// Estadísticas, Configuración) se quedan con su ícono de lucide-react.
import iconInicio from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/inicio.svg'
import iconNexo from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/naxo.svg'
import iconCentroSoporte from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/centro_de_soporte.svg'
import iconHub from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/hub.svg'
import iconVisor from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/visor.svg'
import iconMatomo from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/matomo.svg'
import iconZabbix from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/zabbix.svg'
import iconPm2 from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/pm2.svg'
import iconBebras from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/bebras.svg'
import iconRags from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/rags.svg'
import iconInformesOnix from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/informe_onix.svg'
import iconCodex from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/codex.svg'
import iconEncuestas from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/encuestas.svg'
import iconAdministrador from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/administrador.svg'
import iconUsuarios from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/usuarios.svg'
import iconRoles from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/roles.svg'
import iconModulos from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/modulos.svg'
import iconPermisos from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/permisos.svg'

export const menuItems = [
  { label: 'Home', icon: iconInicio, path: '/' },
  { label: 'Nexo', icon: iconNexo, nexoApp: true, moduleCode: 'nexo_sync', path: '/HomeNexo', children: [
      { label: 'Sincronización', icon: RefreshCw, children: [
          { label: 'Cursos', icon: BookOpen, path: '/sync/cursos', submoduleCode: 'sync_courses' },
          { label: 'Usuarios', icon: Users, path: '/sync/usuarios', submoduleCode: 'sync_users' },
          { label: 'Matrículas', icon: GraduationCap, path: '/sync/matriculas', submoduleCode: 'sync_enrollments' },
          { label: 'Novedades', icon: Bell, path: '/sync/novedades', submoduleCode: 'sync_enrollments_novedades' },
      ]},
      { label: 'Módulos', icon: LayoutGrid, children: [
          { label: 'Usuarios', icon: Users, path: '/modulos/usuarios', submoduleCode: 'module_users' },
          { label: 'Cursos', icon: BookOpen, path: '/modulos/cursos', submoduleCode: 'module_courses' },
          { label: 'Matrículas', icon: GraduationCap, path: '/modulos/matriculas', submoduleCode: 'module_enrollments' },
      ]},
      { label: 'Carga Masiva', icon: Upload, children: [
          { label: 'Usuarios', icon: Users, path: '/carga/usuarios', submoduleCode: 'bulk_upload_users' },
          { label: 'Matrículas', icon: GraduationCap, path: '/carga/matriculas', submoduleCode: 'bulk_upload_enrollments' },
          { label: 'Cancelaciones', icon: UserX, path: '/carga/cancelaciones', submoduleCode: 'bulk_upload_unenrollments' },
      ]},
      { label: 'Reglas', icon: Shield, children: [
          { label: 'Reglas activas', icon: ListChecks, path: '/reglas/activas', submoduleCode: 'rules_active' },
          { label: 'Plantillas', icon: LayoutTemplate, path: '/reglas/plantillas', submoduleCode: 'rules_templates' },
      ]},
      { label: 'Búsqueda', icon: Search, path: '/busqueda', submoduleCode: 'search' },
  ]},

  { type: 'divider' },

  { label: 'Centro de soporte', icon: iconCentroSoporte, moduleCode: 'support_center', submoduleCode: 'access', href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php' },
  { label: 'Hub', icon: iconHub, moduleCode: 'hub', submoduleCode: 'access', href: 'https://hub.pascualbravovirtual.edu.co/login' },
  { label: 'Visor', icon: iconVisor, moduleCode: 'visor', submoduleCode: 'access', href: 'https://seguimiento.pascualbravovirtual.edu.co/' },
  { label: 'Monitoreo', icon: Activity, moduleCode: 'monitoring', submoduleCode: 'access', children: [
      { label: 'Matomo', icon: iconMatomo, comingSoon: true },
      { label: 'Zabbix', icon: iconZabbix, comingSoon: true },
      { label: 'PM2', icon: iconPm2, comingSoon: true },
      { label: 'Bases de Datos', icon: Database, comingSoon: true },
  ]},
  { label: 'Bebras', icon: iconBebras, moduleCode: 'bebras', submoduleCode: 'access', href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/' },
  { label: 'Rags', icon: iconRags, moduleCode: 'rags', submoduleCode: 'access', comingSoon: true },
  { label: 'Informes (Onix-IA)', icon: iconInformesOnix, path: '/informes', moduleCode: 'onix_reports', submoduleCode: 'onix_reports_use' },
  { label: 'CodeX', icon: iconCodex, path: '/codex', moduleCode: 'codex', submoduleCode: 'codex_use' },
  { label: 'Encuestas', icon: iconEncuestas, moduleCode: 'surveys', submoduleCode: 'access', href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login' },
  { label: 'Laboratorios Virtuales', icon: FlaskConical, moduleCode: 'virtual_labs', submoduleCode: 'virtual_labs_grades', comingSoon: true },
  { label: 'Formularios de Asistencia', icon: ClipboardList, path: '/formularios', moduleCode: 'attendance_forms', submoduleCode: 'attendance_forms_manage' },

  { type: 'divider' },

  { label: 'Administrador', icon: iconAdministrador, moduleCode: 'admin', children: [
      { label: 'Usuarios',      icon: iconUsuarios, path: '/admin/usuarios',      submoduleCode: 'admin_users' },
      { label: 'Roles',         icon: iconRoles,    path: '/admin/roles',         submoduleCode: 'admin_roles' },
      { label: 'Módulos',       icon: iconModulos,  path: '/admin/modulos',       submoduleCode: 'admin_modules' },
      { label: 'Permisos',      icon: iconPermisos, path: '/admin/permisos',      submoduleCode: 'admin_permissions' },
      { label: 'Ver Logs',      icon: History, path: '/admin/logs',         submoduleCode: 'admin_logs' },
      { label: 'Integración',   icon: Globe, children: [
          { label: 'Estado de APIs', icon: Server, path: '/admin/integracion/apis', submoduleCode: 'integration_apis' },
      ]},
      { label: 'Reportes',      icon: FileText,    path: '/admin/reportes',      submoduleCode: 'reports' },
      { label: 'Estadísticas',  icon: BarChart2,   path: '/admin/estadisticas',  submoduleCode: 'statistics' },
      { label: 'Configuración', icon: Settings,    path: '/admin/configuracion', submoduleCode: 'settings' },
  ]},
]
