import {
  Home, RefreshCw, BookOpen, FileText, ChevronDown, Menu, User, LogOut,
  ExternalLink, Activity, LayoutGrid, Upload, Shield, Globe, BarChart2, Settings,
  Search, UserCog
} from 'lucide-react'

import { Outlet, NavLink, useNavigate } from 'react-router-dom'


export const menuItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Journey Sync', icon: RefreshCw, journeyApp: true, moduleCode: 'journey_sync', children: [
      { label: 'Home', icon: Home, path: '/HomeJourney', submoduleCode: 'journey_home' },
      { label: 'Sincronización', icon: RefreshCw, children: [
          { label: 'Usuarios', path: '/sync/usuarios', submoduleCode: 'sync_users' },
          { label: 'Matrículas', path: '/sync/matriculas', submoduleCode: 'sync_enrollments' },
          { label: 'Cursos', path: '/sync/cursos', submoduleCode: 'sync_courses' },
      ]},
      { label: 'Módulos', icon: BookOpen, children: [
          { label: 'Usuarios', path: '/modulos/usuarios', submoduleCode: 'module_users' },
          { label: 'Cursos', path: '/modulos/cursos', submoduleCode: 'module_courses' },
          { label: 'Matrículas', path: '/modulos/matriculas', submoduleCode: 'module_enrollments' },
      ]},
      { label: 'Carga Masiva', icon: Upload, children: [
          { label: 'Usuarios', path: '/carga/usuarios', submoduleCode: 'bulk_upload_users' },
          { label: 'Matrículas', path: '/carga/matriculas', submoduleCode: 'bulk_upload_enrollments' },
          { label: 'Novedades', path: '/carga/novedades', submoduleCode: 'bulk_upload_updates' },
          { label: 'Desmatrículas', path: '/carga/desmatriculas', submoduleCode: 'bulk_upload_unenrollments' },
      ]},
      { label: 'Reglas', icon: Shield, children: [
          { label: 'Reglas activas', path: '/reglas/activas', submoduleCode: 'rules_active' },
          { label: 'Plantillas', path: '/reglas/plantillas', submoduleCode: 'rules_templates' },
      ]},
      { label: 'Integración', icon: Globe, children: [
          { label: 'Estado de APIs', path: '/integracion/apis', submoduleCode: 'integration_apis' },
      ]},
      { label: 'Reportes', icon: FileText, path: '/reportes', submoduleCode: 'reports' },
      { label: 'Estadísticas', icon: BarChart2, path: '/estadisticas', submoduleCode: 'statistics' },
      { label: 'Configuración', icon: Settings, path: '/configuracion', submoduleCode: 'settings' },
      { label: 'busqueda', icon: Search, path: '/busqueda', submoduleCode: 'search' },
  ]},

  { type: 'divider' },

  { label: 'Centro de soporte', icon: ExternalLink, moduleCode: 'support_center', href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php' },
  { label: 'Hub', icon: ExternalLink, moduleCode: 'hub', href: 'https://hub.pascualbravovirtual.edu.co/login' },
  { label: 'SIDEM', icon: ExternalLink, moduleCode: 'sidem', href: 'https://seguimiento.pascualbravovirtual.edu.co/' },
  { label: 'Monitoreo', icon: Activity, moduleCode: 'monitoring', children: [
      { label: 'Matomo', comingSoon: true },
      { label: 'Zabbix', comingSoon: true },
      { label: 'PMZ', comingSoon: true },
      { label: 'Bases de Datos', comingSoon: true },
  ]},
  { label: 'Bebras', icon: ExternalLink, moduleCode: 'bebras', href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/' },
  { label: 'Rags', icon: LayoutGrid, moduleCode: 'rags', comingSoon: true },
  { label: 'Informes (Onix-IA)', icon: FileText, moduleCode: 'onix_reports', comingSoon: true },
  { label: 'Moodle Builder', icon: ExternalLink, moduleCode: 'moodle_builder', href: 'https://moodlebuilder.pascualbravovirtual.edu.co/index.html' },
  { label: 'Encuestas', icon: ExternalLink, moduleCode: 'surveys', href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login' },

  { type: 'divider' },

  { label: 'Administrador', icon: UserCog, moduleCode: 'admin', children: [
      { label: 'Usuarios',  path: '/admin/usuarios',  submoduleCode: 'admin_users' },
      { label: 'Roles',     path: '/admin/roles',     submoduleCode: 'admin_roles' },
      { label: 'Módulos',   path: '/admin/modulos',   submoduleCode: 'admin_modules' },
      { label: 'Permisos',  path: '/admin/permisos',  submoduleCode: 'admin_permissions' },
  ]},
]