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
          <Route path="HomeJourney" element={<HomeJourney />} />

          <Route path="sync/usuarios" element={
            <PrivateRoute submoduleCode="usuarios">
              <SyncUsuariosP />
            </PrivateRoute>
          } />
          <Route path="sync/cursos" element={
            <PrivateRoute submoduleCode="cursos">
              <SyncCursos />
            </PrivateRoute>
          } />
          <Route path="sync/matriculas" element={
            <PrivateRoute submoduleCode="matriculas">
              <SyncMatriculas />
            </PrivateRoute>
          } />

          <Route path="modulos/usuarios" element={
            <PrivateRoute submoduleCode="usuarios">
              <ModulosUsuarios />
            </PrivateRoute>
          } />
          <Route path="modulos/cursos" element={
            <PrivateRoute submoduleCode="cursos">
              <ModulosCursos />
            </PrivateRoute>
          } />
          <Route path="modulos/matriculas" element={
            <PrivateRoute submoduleCode="matriculas">
              <ModulosMatriculas />
            </PrivateRoute>
          } />

          <Route path="carga/usuarios" element={
            <PrivateRoute submoduleCode="usuarios">
              <CargaUsuarios />
            </PrivateRoute>
          } />
          <Route path="carga/matriculas" element={
            <PrivateRoute submoduleCode="matriculas">
              <CargaMatriculas />
            </PrivateRoute>
          } />
          <Route path="carga/novedades" element={
            <PrivateRoute submoduleCode="novedades">
              <CargaNovedades />
            </PrivateRoute>
          } />
          <Route path="carga/desmatriculas" element={
            <PrivateRoute submoduleCode="desmatriculas">
              <CargaDesmatriculas />
            </PrivateRoute>
          } />

          <Route path="reglas/activas" element={
            <PrivateRoute submoduleCode="activas">
              <ReglasActivas />
            </PrivateRoute>
          } />
          <Route path="reglas/plantillas" element={
            <PrivateRoute submoduleCode="plantillas">
              <ReglasPlantillas />
            </PrivateRoute>
          } />

          <Route path="integracion/apis" element={
            <PrivateRoute submoduleCode="apis">
              <IntegracionApis />
            </PrivateRoute>
          } />

          <Route path="reportes" element={
            <PrivateRoute submoduleCode="reportes">
              <Reportes />
            </PrivateRoute>
          } />
          <Route path="estadisticas" element={
            <PrivateRoute submoduleCode="estadisticas">
              <Estadisticas />
            </PrivateRoute>
          } />
          <Route path="busqueda" element={
            <PrivateRoute submoduleCode="busqueda">
              <Busqueda />
            </PrivateRoute>
          } />
          <Route path="configuracion" element={
            <PrivateRoute submoduleCode="configuracion">
              <Configuracion />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
