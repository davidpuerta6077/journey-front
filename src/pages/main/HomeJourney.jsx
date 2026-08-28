import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { Users, BookOpen, Activity, RefreshCw, GraduationCap } from 'lucide-react'
import { fetchIndicadorUsuarios } from '../../services/home/fetchIndicadorUsuarios'
import { fetchIndicadorCursos } from '../../services/home/fetchIndicadorCursos'
import { fetchIndicadorMatriculas } from '../../services/home/fetchIndicadorMatriculas'
import { fetchApiStatus } from '../../services/home/fetchApiStatus'
import '../../styles/global/Global.css'

import config from "../../config"
const BASE = config.api_domain.url_base

export default function HomeJourney() {
  const navigate = useNavigate()
  const [indicadores, setIndicadores] = useState({
    usuarios: 0,
    cursos: 0,
    matriculas: 0,
  })
  const [test, setTests] = useState('Verificando API')

  const cargarIndicadores = useCallback(async () => {
    try {
      const testRes = await fetchApiStatus()
      setTests(testRes)
      const [usuarios, cursos, matriculas] = await Promise.all([
        fetchIndicadorUsuarios(),
        fetchIndicadorCursos(),
        fetchIndicadorMatriculas(),
      ])
      setIndicadores({ usuarios, cursos, matriculas })
    } catch {
      setIndicadores(prev => ({ ...prev }))
    }
  }, [])

  useEffect(() => { cargarIndicadores() }, [cargarIndicadores])

  const acciones = [
    { label: 'Usuarios Plataforma', icon: Users,         path: '/sync/usuarios' },
    { label: 'Matrículas',          icon: GraduationCap, path: '/sync/matriculas' },
    { label: 'Cursos',              icon: BookOpen,       path: '/sync/cursos' },
  ]

  return (
    <div className="home">
      <div className="home-header">
        <div>
          <h2>Journey Sync</h2>
          <p className="home-subtitle">Recursos más usados</p>
        </div>
        <div className="home-sync-btns">
          <button className="btn-sync" onClick={() => navigate('/sync/usuarios')}>
            <RefreshCw size={14} /> Sync Usuarios
          </button>
          <button className="btn-sync btn-sync-secondary" onClick={() => navigate('/sync/matriculas')}>
            <RefreshCw size={14} /> Sync Matrículas
          </button>
          <button className="btn-sync btn-sync-outline" onClick={() => navigate('/sync/cursos')}>
            <RefreshCw size={14} /> Sync Cursos
          </button>
        </div>
      </div>

      <div className="home-cards">
        {acciones.map(a => {
          const Icon = a.icon
          return (
            <button key={a.path} className="home-card" onClick={() => navigate(a.path)}>
              <Icon size={28} strokeWidth={1.5} className="home-card-icon" />
              <span className="home-card-label">{a.label}</span>
            </button>
          )
        })}
      </div>

      <div className="home-panel">
        <h5>Indicadores Journey</h5>
        <div className="home-indicators">
          <div className="indicator-card">
            <Users size={24} strokeWidth={1.5} className="indicator-icon" />
            <span className="indicator-value">{indicadores.usuarios}</span>
            <span className="indicator-label">Usuarios en BD</span>
          </div>
          <div className="indicator-card">
            <BookOpen size={24} strokeWidth={1.5} className="indicator-icon" />
            <span className="indicator-value">{indicadores.cursos}</span>
            <span className="indicator-label">Cursos</span>
          </div>
          <div className="indicator-card">
            <GraduationCap size={24} strokeWidth={1.5} className="indicator-icon" />
            <span className="indicator-value">{indicadores.matriculas}</span>
            <span className="indicator-label">Matrículas</span>
          </div>
          <div className="indicator-card">
            <Activity size={24} strokeWidth={1.5} className="indicator-icon" />
            <span className="indicator-value indicator-status">{test}</span>
            <span className="indicator-label">Estado API</span>
          </div>
        </div>
      </div>
    </div>
  )
}