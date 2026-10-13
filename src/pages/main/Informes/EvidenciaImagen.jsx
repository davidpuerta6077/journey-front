import { useEffect, useState } from 'react'
import { getEvidenciaImagenUrl } from '../../../services/onix/onixApi'

export default function EvidenciaImagen({ id, alt }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl = null
    let activo = true
    getEvidenciaImagenUrl(id)
      .then((u) => { objectUrl = u; if (activo) setUrl(u) })
      .catch(() => activo && setError(true))
    return () => {
      activo = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  if (error) return <span>Imagen no disponible</span>
  if (!url) return <span>Cargando imagen...</span>
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={alt || 'Evidencia'} /></a>
}
