import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideNavMain from './components/SideNavMain'
import './styles/global/Layout.css'

import Home from './pages/Home'

import SyncUsuariosP  from './pages/main/SyncUsuariosP'
import SyncCursos     from './pages/main/SyncCursos'
import SyncMatriculas from './pages/main/SyncMatriculas'

import ModulosUsuarios   from './pages/main/ModulosUsuarios'
import ModulosCursos     from './pages/main/ModulosCursos'
import ModulosMatriculas from './pages/main/ModulosMatriculas'

import CargaUsuarios      from './pages/main/CargaUsuarios'
import CargaMatriculas    from './pages/main/CargaMatriculas'
import CargaNovedades     from './pages/main/CargaNovedades'
import CargaDesmatriculas from './pages/main/CargaDesmatriculas'

import ReglasActivas    from './pages/main/ReglasActivas'
import ReglasPlantillas from './pages/main/ReglasPlantillas'

import IntegracionApis from './pages/main/IntegracionApis'

import Reportes      from './pages/main/Reportes'
import Estadisticas  from './pages/main/Estadisticas'
import Busqueda      from './pages/main/Busqueda'
import Configuracion from './pages/main/Configuracion'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SideNavMain />}>
          <Route index element={<Home />} />

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