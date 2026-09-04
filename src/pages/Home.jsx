import { useNavigate } from 'react-router-dom'
import '../styles/global/Global.css'

const services = [
  {
    name: 'Journey Sync',
    description: 'Sincronización de usuarios, cursos y matrículas con Moodle',
    icon: '⚡',
    color: '#3b82f6',
    path: '/HomeJourney',
    internal: true,
  },
  {
    name: 'Administrador',
    description: 'Gestión de usuarios, roles, módulos y permisos de Bravo Suite',
    icon: '🛡️',
    color: '#0ea5e9',
    path: '/admin/usuarios',
    internal: true,
  },
  {
    name: 'Centro de Soporte',
    description: 'Gestión de tickets y soporte técnico institucional',
    icon: '🎧',
    color: '#8b5cf6',
    href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php',
  },
  {
    name: 'Hub',
    description: 'Portal centralizado de recursos y herramientas',
    icon: '🌐',
    color: '#06b6d4',
    href: 'https://hub.pascualbravovirtual.edu.co/login',
  },
  {
    name: 'SIDEM',
    description: 'Sistema de seguimiento y monitoreo académico',
    icon: '📊',
    color: '#10b981',
    href: 'https://seguimiento.pascualbravovirtual.edu.co/',
  },
  {
    name: 'Matomo',
    description: 'Analítica web y seguimiento de usuarios',
    icon: '📈',
    color: '#f59e0b',
    comingSoon: true,
  },
  {
    name: 'Zabbix',
    description: 'Monitoreo de infraestructura y servidores',
    icon: '🖥️',
    color: '#ef4444',
    comingSoon: true,
  },
  {
    name: 'Bebras',
    description: 'Plataforma de pensamiento computacional',
    icon: '🦫',
    color: '#84cc16',
    href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/',
  },
  {
    name: 'Moodle Builder',
    description: 'Constructor y configurador de cursos Moodle',
    icon: '🏗️',
    color: '#f97316',
    href: 'https://moodlebuilder.pascualbravovirtual.edu.co/index.html',
  },
  {
    name: 'Encuestas',
    description: 'Creación y gestión de encuestas institucionales',
    icon: '📋',
    color: '#ec4899',
    href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login',
  },
  {
    name: 'Informes (Onix-IA)',
    description: 'Generación de informes con inteligencia artificial',
    icon: '🤖',
    color: '#6366f1',
    comingSoon: true,
  },
  {
    name: 'Rags',
    description: 'Herramienta de recursos y gestión académica',
    icon: '📚',
    color: '#14b8a6',
    comingSoon: true,
  },
  {
    name: 'PM2',
    description: 'Panel de monitoreo de zonas y servicios',
    icon: '🗺️',
    color: '#a855f7',
    comingSoon: true,
  },
]

export default function Home() {
  const navigate = useNavigate()

  const handleClick = (service) => {
    if (service.comingSoon) return
    if (service.internal) navigate(service.path)
    else window.open(service.href, '_blank')
  }

  return (
    <div className="bravosuite-home">
      <div className="bravosuite-header">
        <h1>Br<span>@</span>vo Suite</h1>
        <p>Plataforma integrada de herramientas institucionales</p>
      </div>

      <div className="bravosuite-grid">
        {services.map((service, i) => (
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