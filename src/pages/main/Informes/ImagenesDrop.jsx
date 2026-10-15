import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { alertError } from '../../../services/alerts'
import { filtrarImagenes } from './evidencias'

// Zona para agregar imágenes: arrastrar, pegar (Ctrl+V con la zona enfocada)
// o clic para elegir varias. Valida tipo y tamaño antes de entregarlas.
export default function ImagenesDrop({ onArchivos, disabled = false }) {
  const input = useRef(null)
  const [encima, setEncima] = useState(false)

  const recibir = (lista) => {
    const { validas, rechazadas } = filtrarImagenes([...lista])
    if (rechazadas.length) alertError(rechazadas.join('. '))
    if (validas.length) onArchivos(validas)
  }

  const elegir = () => { if (!disabled) input.current.click() }

  return (
    <>
      <div
        className={`onix-drop${encima ? ' encima' : ''}${disabled ? ' disabled' : ''}`}
        role="button" tabIndex={0} aria-disabled={disabled}
        aria-label="Agregar imágenes: arrastra, pega con Ctrl+V o presiona Enter para elegir"
        onClick={elegir}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir() } }}
        onPaste={(e) => {
          const files = [...e.clipboardData.files]
          if (disabled || !files.length) return
          e.preventDefault()
          recibir(files)
        }}
        onDragOver={(e) => { e.preventDefault(); setEncima(true) }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); if (!disabled) recibir(e.dataTransfer.files) }}
      >
        <ImagePlus size={18} aria-hidden="true" />
        <span>{disabled ? 'Subiendo imágenes...' : 'Arrastra imágenes, pégalas (Ctrl+V) o haz clic para elegir'}</span>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png" multiple hidden
        onChange={(e) => { recibir(e.target.files); e.target.value = '' }} />
    </>
  )
}
