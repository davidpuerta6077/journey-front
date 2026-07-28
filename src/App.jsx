import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideNavMain from './components/SideNavMain'
import PrivateRoute from './components/PrivateRoute'
import './styles/global/Layout.css'

import Login from './pages/Login'
import Home  from './pages/Home'

// ─── JOURNEY SYNC ─────────────────────────────────────────────────────────────
import HomeJourney    from './pages/main/HomeJourney'
import SyncUsuariosP  from './pages/main/Sync/SyncUsuariosP'
import SyncCursos     from './pages/main/Sync/SyncCursos'
import SyncMatriculas from './pages/main/Sync/SyncMatriculas'

import ModulosUsuarios   from './pages/main/Modulo/ModulosUsuarios'
import ModulosCursos     from './pages/main/Modulo/ModulosCursos'
import ModulosMatriculas from './pages/main/Modulo/ModulosMatriculas'

import CargaUsuarios      from './pages/main/CargaMasiva/CargaUsuarios'
import CargaMatriculas    from './pages/main/CargaMasiva/CargaMatriculas'
import CargaNovedades     from './pages/main/CargaMasiva/CargaNovedades'
import CargaDesmatriculas from './pages/main/CargaMasiva/CargaDesmatriculas'

import ReglasActivas    from './pages/main/Regla/ReglasActivas'
import ReglasPlantillas from './pages/main/Regla/ReglasPlantillas'

import IntegracionApis from './pages/main/Integracion/IntegracionApis'

import Reportes      from './pages/main/Reportes/Reportes'
import Estadisticas  from './pages/main/Estadisticas/Estadisticas'
import Busqueda      from './pages/main/Busqueda/Busqueda'
import Configuracion from './pages/main/Configuracion/Configuracion'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
                <PrivateRoute>
                  <SideNavMain />
                </PrivateRoute>
        }>
          {/* ─── BRAVO SUITE HOME ─── */}
          <Route index element={<Home />} />

          {/* ─── JOURNEY SYNC ─── */}
          <Route path="HomeJourney" element={<HomeJourney />} />

          <Route path="sync/usuarios"   element={<SyncUsuariosP />} />
          <Route path="sync/cursos"     element={<SyncCursos />} />
          <Route path="sync/matriculas" element={<SyncMatriculas />} />

          <Route path="modulos/usuarios"   element={<ModulosUsuarios />} />
          <Route path="modulos/cursos"     element={<ModulosCursos />} />
          <Route path="modulos/matriculas" element={<ModulosMatriculas />} />

          <Route path="carga/usuarios"      element={<CargaUsuarios />} />
          <Route path="carga/matriculas"    element={<CargaMatriculas />} />
          <Route path="carga/novedades"     element={<CargaNovedades />} />
          <Route path="carga/desmatriculas" element={<CargaDesmatriculas />} />

          <Route path="reglas/activas"    element={<ReglasActivas />} />
          <Route path="reglas/plantillas" element={<ReglasPlantillas />} />

          <Route path="integracion/apis" element={<IntegracionApis />} />

          <Route path="reportes"      element={<Reportes />} />
          <Route path="estadisticas"  element={<Estadisticas />} />
          <Route path="busqueda"      element={<Busqueda />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App