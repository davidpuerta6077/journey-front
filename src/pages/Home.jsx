import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../services/PermissionsContext'
import '../styles/global/Global.css'

const services = [
  {
    name: 'Nexo',
    description: 'Sincronización de usuarios, cursos y matrículas con Moodle',
    icon: '⚡',
    color: '#3b82f6',
    path: '/HomeNexo',
    internal: true,
    moduleCode: 'nexo_sync',
  },
  {
    name: 'Administrador',
    description: 'Gestión de usuarios, roles, módulos y permisos de Bravo Hub',
    icon: '🛡️',
    color: '#0ea5e9',
    path: '/admin/usuarios',
    internal: true,
    moduleCode: 'admin',
  },
  {
    name: 'Centro de Soporte',
    description: 'Gestión de tickets y soporte técnico institucional',
    icon: '🎧',
    color: '#8b5cf6',
    href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php',
    moduleCode: 'support_center',
    submoduleCode: 'access',
  },
  {
    name: 'Hub',
    description: 'Portal centralizado de recursos y herramientas',
    icon: '🌐',
    color: '#06b6d4',
    href: 'https://hub.pascualbravovirtual.edu.co/login',
    moduleCode: 'hub',
    submoduleCode: 'access',
  },
  {
    name: 'Visor',
    description: 'Sistema de seguimiento y monitoreo académico',
    icon: '👁️',
    color: '#10b981',
    href: 'https://seguimiento.pascualbravovirtual.edu.co/',
    moduleCode: 'visor',
    submoduleCode: 'access',
  },
  {
    name: 'Matomo',
    description: 'Analítica web y seguimiento de usuarios',
    icon: '📈',
    color: '#f59e0b',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
  {
    name: 'Zabbix',
    description: 'Monitoreo de infraestructura y servidores',
    icon: '🖥️',
    color: '#ef4444',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
  {
    name: 'Bebras',
    description: 'Plataforma de pensamiento computacional',
    icon: '🦫',
    color: '#84cc16',
    href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/',
    moduleCode: 'bebras',
    submoduleCode: 'access',
  },
  {
    name: 'CodeX',
    description: 'Constructor y configurador de cursos Moodle',
    icon: '🏗️',
    color: '#f97316',
    href: 'https://moodlebuilder.pascualbravovirtual.edu.co/index.html',
    moduleCode: 'codex',
    submoduleCode: 'access',
  },
  {
    name: 'Encuestas',
    description: 'Creación y gestión de encuestas institucionales',
    icon: '📋',
    color: '#ec4899',
    href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login',
    moduleCode: 'surveys',
    submoduleCode: 'access',
  },
  {
    name: 'Informes (Onix-IA)',
    description: 'Generación de informes con inteligencia artificial',
    icon: '🤖',
    color: '#6366f1',
    comingSoon: true,
    moduleCode: 'onix_reports',
    submoduleCode: 'access',
  },
  {
    name: 'Rags',
    description: 'Herramienta de recursos y gestión académica',
    icon: '📚',
    color: '#14b8a6',
    comingSoon: true,
    moduleCode: 'rags',
    submoduleCode: 'access',
  },
  {
    name: 'Laboratorios Virtuales',
    description: 'Registro y consulta de calificaciones de laboratorios virtuales',
    icon: '🧪',
    color: '#22c55e',
    comingSoon: true,
    moduleCode: 'virtual_labs',
    submoduleCode: 'virtual_labs_grades',
  },
  {
    name: 'PM2',
    description: 'Panel de monitoreo de zonas y servicios',
    icon: '🗺️',
    color: '#a855f7',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { permissions } = usePermissions()

  const hasAccess = (service) => {
    if (!service.moduleCode) return true
    const mod = permissions?.modules?.find(m => m.module_code === service.moduleCode)
    if (!mod) return false
    if (service.submoduleCode) return mod.submodules.some(s => s.submodule_code === service.submoduleCode)
    return mod.submodules.length > 0
  }

  const visibleServices = services.filter(hasAccess)

  const handleClick = (service) => {
    if (service.comingSoon) return
    if (service.internal) navigate(service.path)
    else window.open(service.href, '_blank')
  }

  return (
    <div className="bravosuite-home">
      <div className="bravosuite-header">
        <h1>Bravo Hub</h1>
        <p>Plataforma integrada de herramientas institucionales</p>
      </div>

      <div className="bravosuite-grid">
        {visibleServices.map((service, i) => (
          <div
            key={i}
            className={`bravosuite-card ${service.comingSoon ? 'bravosuite-card-soon' : ''}`}
            onClick={() => handleClick(service)}
            style={{'--card-color': service.color}}
          >
            <div className="bravosuite-card-top">
              <span className="bravosuite-card-icon">{service.icon}</span>
              {!service.comingSoon && !service.internal && (
                <span className="bravosuite-ext-badge">↗</span>
              )}
              {service.comingSoon && (
                <span className="bravosuite-soon-badge">Próximamente</span>
              )}
            </div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}