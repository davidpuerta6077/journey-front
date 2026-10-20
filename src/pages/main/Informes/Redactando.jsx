import { useEffect, useRef, useState } from 'react'

// Aviso visible mientras la IA redacta (tarda de segundos a un par de minutos).
// Se monta solo durante la redacción: el contador arranca en 0 cada vez.
export default function Redactando({ texto = 'Redactando con IA...' }) {
  const [segundos, setSegundos] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div ref={ref} className="loading-box onix-redactando" role="status" aria-live="polite">
      <span className="loader"></span>
      <strong>{texto}</strong>
      <span>{segundos}s · puede tardar hasta un par de minutos. No cierres esta ventana.</span>
    </div>
  )
}
