import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'

// Vista previa de una imagen que aún no se ha subido.
export default function Miniatura({ file, onQuitar }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div className="onix-evidencia">
      {url && <img src={url} alt={file.name} />}
      <button type="button" className="btn-icon btn-icon-delete" title="Quitar imagen" aria-label={`Quitar ${file.name}`} onClick={onQuitar}><X size={13} /></button>
    </div>
  )
}
