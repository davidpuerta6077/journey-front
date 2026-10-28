import { Construction } from 'lucide-react'

export default function EnConstruccion({ titulo }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: '16px',
      color: '#888', textAlign: 'center'
    }}>
      <Construction size={52} strokeWidth={1.2} color="#ccc" />
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--titulo, #2d4375)', margin: 0 }}>
        {titulo}
      </h2>
      <p style={{ fontSize: '13px', margin: 0 }}>Esta sección está en construcción.</p>
    </div>
  )
}