// Mismo límite que el API (services/onix/storage.js): JPG o PNG hasta 5 MB.
const TIPOS_IMAGEN = ['image/jpeg', 'image/png']
const MAX_IMAGEN = 5 * 1024 * 1024

// Separa las imágenes válidas de las rechazadas, con el motivo de cada una.
export function filtrarImagenes(files) {
  const validas = []
  const rechazadas = []
  for (const f of files) {
    if (!TIPOS_IMAGEN.includes(f.type)) rechazadas.push(`${f.name}: solo se aceptan JPG o PNG`)
    else if (f.size > MAX_IMAGEN) rechazadas.push(`${f.name}: supera los 5 MB`)
    else validas.push(f)
  }
  return { validas, rechazadas }
}

// Subactividades anteriores al campo título: se muestra la primera línea del texto.
export const tituloDe = (r) => r.titulo || (r.desarrollo || '').split('\n')[0].slice(0, 80)

// Lista para el documento de la actividad y el zip: párrafo y documento generados.
export const generada = (r) => !!(r.parrafo && r.documento)
