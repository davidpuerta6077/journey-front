import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideNavMain from './components/sidenav/SideNavMain'
import PrivateRoute from './components/PrivateRoute'
import './styles/global/Layout.css'

import Login from './pages/Login'
import Home from './pages/Home'

// ─── JOURNEY SYNC ─────────────────────────────────────────────────────────────
import HomeJourney from './pages/main/HomeJourney'
import SyncUsuariosP from './pages/main/Sync/SyncUsuariosP'
import SyncCursos from './pages/main/Sync/SyncCursos'
import SyncMatriculas from './pages/main/Sync/SyncMatriculas'

import ModulosUsuarios from './pages/main/Modulo/ModulosUsuarios'
import ModulosCursos from './pages/main/Modulo/ModulosCursos'
import ModulosMatriculas from './pages/main/Modulo/ModulosMatriculas'

import CargaUsuarios from './pages/main/CargaMasiva/CargaUsuarios'
import CargaMatriculas from './pages/main/CargaMasiva/CargaMatriculas'
import CargaNovedades from './pages/main/CargaMasiva/CargaNovedades'
import CargaDesmatriculas from './pages/main/CargaMasiva/CargaDesmatriculas'

import ReglasActivas from './pages/main/Regla/ReglasActivas'
import ReglasPlantillas from './pages/main/Regla/ReglasPlantillas'

import IntegracionApis from './pages/main/Integracion/IntegracionApis'

import Reportes from './pages/main/Reportes/Reportes'
import Estadisticas from './pages/main/Estadisticas/Estadisticas'
import Busqueda from './pages/main/Busqueda/Busqueda'
import Configuracion from './pages/main/Configuracion/Configuracion'

import NoAutorizado from './pages/NoAutorizado'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/no-autorizado" element={<NoAutorizado />} />

        <Route path="/" element={
          <PrivateRoute>
            <SideNavMain />
          </PrivateRoute>
        }>
          {/* ─── BRAVO SUITE HOME ─── */}
          <Route index element={<Home />} />

          {/* ─── JOURNEY SYNC ─── */}
          <Route path="HomeJourney" submoduleCode='journey_home' element={<HomeJourney />} />

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
          <Route path="carga/novedades" element={
            <PrivateRoute submoduleCode="bulk_upload_updates">
              <CargaNovedades />
            </PrivateRoute>
          } />
          <Route path="carga/desmatriculas" element={
            <PrivateRoute submoduleCode="bulk_upload_unenrollments">
              <CargaDesmatriculas />
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

          <Route path="integracion/apis" element={
            <PrivateRoute submoduleCode="integration_apis">
              <IntegracionApis />
            </PrivateRoute>
          } />

          <Route path="reportes" element={
            <PrivateRoute submoduleCode="reports">
              <Reportes />
            </PrivateRoute>
          } />
          <Route path="estadisticas" element={
            <PrivateRoute submoduleCode="statistics">
              <Estadisticas />
            </PrivateRoute>
          } />
          <Route path="busqueda" element={
            <PrivateRoute submoduleCode="search">
              <Busqueda />
            </PrivateRoute>
          } />
          <Route path="configuracion" element={
            <PrivateRoute submoduleCode="settings">
              <Configuracion />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
