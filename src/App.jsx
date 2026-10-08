import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideNavMain from './components/sidenav/SideNavMain'
import PrivateRoute from './components/PrivateRoute'
import './styles/global/Layout.css'

import Login from './pages/Login'
import Home from './pages/Home'
import FormularioPublico from './pages/main/Formularios/FormularioPublico'

// ─── NEXO SYNC ─────────────────────────────────────────────────────────────
import HomeNexo from './pages/main/HomeNexo'
import SyncUsuariosP from './pages/main/Sync/SyncUsuariosP'
import SyncCursos from './pages/main/Sync/SyncCursos'
import SyncMatriculas from './pages/main/Sync/SyncMatriculas'
import SyncNovedades from './pages/main/Sync/SyncNovedades'

import ModulosUsuarios from './pages/main/Modulo/ModulosUsuarios'
import ModulosCursos from './pages/main/Modulo/ModulosCursos'
import ModulosMatriculas from './pages/main/Modulo/ModulosMatriculas'

import CargaUsuarios from './pages/main/CargaMasiva/CargaUsuarios'
import CargaMatriculas from './pages/main/CargaMasiva/CargaMatriculas'
import CargaCancelaciones from './pages/main/CargaMasiva/CargaCancelaciones'

import ReglasActivas from './pages/main/Regla/ReglasActivas'
import ReglasPlantillas from './pages/main/Regla/ReglasPlantillas'

import Busqueda from './pages/main/Busqueda/Busqueda'

// ─── ADMINISTRADOR (BRAVO HUB) ───────────────────────────────────────────────
import AdminUsuarios from './pages/main/Admin/AdminUsuarios'
import AdminRoles from './pages/main/Admin/AdminRoles'
import AdminModulos from './pages/main/Admin/AdminModulos'
import AdminPermisos from './pages/main/Admin/AdminPermisos'
import AdminLogs from './pages/main/Admin/AdminLogs'
import IntegracionApis from './pages/main/Integracion/IntegracionApis'
import Reportes from './pages/main/Reportes/Reportes'
import FormulariosList from './pages/main/Formularios/FormulariosList'
import FormularioEditor from './pages/main/Formularios/FormularioEditor'
import FormularioInscritos from './pages/main/Formularios/FormularioInscritos'
import ReporteDetalle from './pages/main/Reportes/ReporteDetalle'
import Estadisticas from './pages/main/Estadisticas/Estadisticas'
import Configuracion from './pages/main/Configuracion/Configuracion'

// ─── MI PERFIL ──────────────────────────────────────────────────────────────
import MiPerfil from './pages/main/Perfil/MiPerfil'

import NoAutorizado from './pages/NoAutorizado'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/no-autorizado" element={<NoAutorizado />} />
        <Route path="/f/:publicToken" element={<FormularioPublico />} />

        <Route path="/" element={
          <PrivateRoute>
            <SideNavMain />
          </PrivateRoute>
        }>
          {/* ─── BRAVO HUB HOME ─── */}
          <Route index element={<Home />} />

          {/* ─── NEXO SYNC ─── */}
          <Route path="HomeNexo" submoduleCode='nexo_home' element={<HomeNexo />} />

          <Route path="sync/usuarios" element={
            <PrivateRoute submoduleCode="sync_users">
              <SyncUsuariosP />
            </PrivateRoute>
          } />
          <Route path="sync/cursos" element={
            <PrivateRoute submoduleCode="sync_courses">
              <SyncCursos />
            </PrivateRoute>
          } />
          <Route path="sync/matriculas" element={
            <PrivateRoute submoduleCode="sync_enrollments">
              <SyncMatriculas />
            </PrivateRoute>
          } />
          <Route path="sync/novedades" element={
            <PrivateRoute submoduleCode="sync_enrollments_novedades">
              <SyncNovedades />
            </PrivateRoute>
          } />

          <Route path="modulos/usuarios" element={
            <PrivateRoute submoduleCode="module_users">
              <ModulosUsuarios />
            </PrivateRoute>
          } />
          <Route path="modulos/cursos" element={
            <PrivateRoute submoduleCode="module_courses">
              <ModulosCursos />
            </PrivateRoute>
          } />
          <Route path="modulos/matriculas" element={
            <PrivateRoute submoduleCode="module_enrollments">
              <ModulosMatriculas />
            </PrivateRoute>
          } />

          <Route path="carga/usuarios" element={
            <PrivateRoute submoduleCode="bulk_upload_users">
              <CargaUsuarios />
            </PrivateRoute>
          } />
          <Route path="carga/matriculas" element={
            <PrivateRoute submoduleCode="bulk_upload_enrollments">
              <CargaMatriculas />
            </PrivateRoute>
          } />
          <Route path="carga/cancelaciones" element={
            <PrivateRoute submoduleCode="bulk_upload_unenrollments">
              <CargaCancelaciones />
            </PrivateRoute>
          } />

          <Route path="reglas/activas" element={
            <PrivateRoute submoduleCode="rules_active">
              <ReglasActivas />
            </PrivateRoute>
          } />
          <Route path="reglas/plantillas" element={
            <PrivateRoute submoduleCode="rules_templates">
              <ReglasPlantillas />
            </PrivateRoute>
          } />

          <Route path="busqueda" element={
            <PrivateRoute submoduleCode="search">
              <Busqueda />
            </PrivateRoute>
          } />

          {/* ─── FORMULARIOS DE ASISTENCIA ─── */}
          <Route path="formularios" element={
            <PrivateRoute submoduleCode="attendance_forms_manage">
              <FormulariosList />
            </PrivateRoute>
          } />
          <Route path="formularios/nuevo" element={
            <PrivateRoute submoduleCode="attendance_forms_manage">
              <FormularioEditor />
            </PrivateRoute>
          } />
          <Route path="formularios/:id/editar" element={
            <PrivateRoute submoduleCode="attendance_forms_manage">
              <FormularioEditor />
            </PrivateRoute>
          } />
          <Route path="formularios/:id/inscritos" element={
            <PrivateRoute submoduleCode="attendance_forms_manage">
              <FormularioInscritos />
            </PrivateRoute>
          } />

          {/* ─── ADMINISTRADOR (BRAVO HUB) ─── */}
          <Route path="admin/usuarios" element={
            <PrivateRoute submoduleCode="admin_users">
              <AdminUsuarios />
            </PrivateRoute>
          } />
          <Route path="admin/roles" element={
            <PrivateRoute submoduleCode="admin_roles">
              <AdminRoles />
            </PrivateRoute>
          } />
          <Route path="admin/modulos" element={
            <PrivateRoute submoduleCode="admin_modules">
              <AdminModulos />
            </PrivateRoute>
          } />
          <Route path="admin/permisos" element={
            <PrivateRoute submoduleCode="admin_permissions">
              <AdminPermisos />
            </PrivateRoute>
          } />
          <Route path="admin/logs" element={
            <PrivateRoute submoduleCode="admin_logs">
              <AdminLogs />
            </PrivateRoute>
          } />
          <Route path="admin/integracion/apis" element={
            <PrivateRoute submoduleCode="integration_apis">
              <IntegracionApis />
            </PrivateRoute>
          } />
          <Route path="admin/reportes" element={
            <PrivateRoute submoduleCode="reports">
              <Reportes />
            </PrivateRoute>
          } />
          <Route path="admin/reportes/:id" element={
            <PrivateRoute submoduleCode="reports">
              <ReporteDetalle />
            </PrivateRoute>
          } />
          <Route path="admin/estadisticas" element={
            <PrivateRoute submoduleCode="statistics">
              <Estadisticas />
            </PrivateRoute>
          } />
          <Route path="admin/configuracion" element={
            <PrivateRoute submoduleCode="settings">
              <Configuracion />
            </PrivateRoute>
          } />

          {/* ─── MI PERFIL ─── */}
          <Route path="perfil" element={<MiPerfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
