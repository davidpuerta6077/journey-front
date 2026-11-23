import { jsPDF } from 'jspdf'

// RF-06: carta a Vicerrectoría para autorizar la contratación de un docente de cátedra
// con carga mínima. Sigue el formato GDC-FR-13 ("Autorización carga mínima"): membrete y
// pie institucionales, destinataria, asunto y firma de la líder del departamento.
// El consecutivo ("Código") queda en blanco para diligenciarlo; la firma es a mano.
const DESTINATARIA = { nombre: 'LINA MARÍA ORTÍZ QUIMBAY', cargo: 'Vicerrectora Enseñanza y Aprendizaje' }
const FIRMANTE = { nombre: 'BIVIANA ARANGO MUÑOZ', cargo: 'Líder Departamento Sistemas Digitales' }
const INSTITUCION = 'Institución Universitaria Pascual Bravo'
const ENCABEZADO = '/formatos/asignia/membrete-encabezado.jpg'
const PIE = '/formatos/asignia/membrete-pie.png'

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const DECENAS = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' }

// "ocho (8)"; con decimales solo el número.
function horasEnLetras(n) {
  const v = Number(n) || 0
  if (!Number.isInteger(v) || v < 0 || v > 99) return String(v).replace('.', ',')
  const letras = v < 30 ? UNIDADES[v] : `${DECENAS[Math.floor(v / 10)]}${v % 10 ? ` y ${UNIDADES[v % 10]}` : ''}`
  return `${letras} (${v})`
}

const fmt = (n) => (Number.isInteger(Number(n)) ? String(Number(n)) : Number(n).toFixed(1).replace('.', ','))

async function imagen(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((ok, mal) => {
    const r = new FileReader()
    r.onload = () => ok(r.result)
    r.onerror = mal
    r.readAsDataURL(blob)
  })
}

// profesor: { nombre, documento, nivel: { nombre, min_horas }, horas }; periodo: '2027-1'; redacto: quien la genera.
export async function descargarSolicitudHoras(profesor, periodo, redacto) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', compress: true })
  const anchoPag = doc.internal.pageSize.getWidth()
  const altoPag = doc.internal.pageSize.getHeight()
  const x = 30
  const ancho = anchoPag - x * 2
  const [enc, pie] = await Promise.all([imagen(ENCABEZADO).catch(() => null), imagen(PIE).catch(() => null)])
  if (enc) doc.addImage(enc, 'JPEG', 0, 0, anchoPag, anchoPag * 355 / 2048)
  if (pie) doc.addImage(pie, 'PNG', 0, altoPag - 31.5, anchoPag, 31.5, undefined, 'FAST')

  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
  const nombre = (profesor.nombre || '').toUpperCase()
  let y = 50
  const linea = (texto, { negrita = false, salto = 5.5 } = {}) => {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    doc.text(texto, x, y)
    y += salto
  }

  doc.setFontSize(12)
  linea('Código', { negrita: true, salto: 11 })
  linea(`Distrito Especial de Ciencia, Tecnología e Innovación de Medellín, ${hoy}`, { salto: 11 })
  linea('Señora')
  linea(DESTINATARIA.nombre, { negrita: true })
  linea(DESTINATARIA.cargo)
  linea(INSTITUCION, { salto: 11 })
  linea('Asunto:  Docente de cátedra con carga mínima', { negrita: true, salto: 11 })
  linea('Apreciada vicerrectora,', { salto: 9 })

  const min = profesor.nivel?.min_horas || 0
  const cuerpo = `Le solicito revisar la viabilidad de autorizar la contratación del docente ${nombre} ${profesor.documento || ''}. `
    + `De acuerdo con la programación académica del semestre ${periodo || ''}, la carga académica del profesor presentará variaciones `
    + `derivadas de la programación de los cursos, por lo que en algunos momentos del período no se cumplirá con la carga mínima de `
    + `${horasEnLetras(min)} horas semanales establecida para su nivel académico (${profesor.nivel?.nombre || '—'}). `
    + `Actualmente tiene ${fmt(profesor.horas || 0)} horas semanales asignadas.`
  doc.setFont('helvetica', 'normal')
  const lineas = doc.splitTextToSize(cuerpo, ancho)
  doc.text(lineas, x, y, { align: 'justify', maxWidth: ancho })
  y += lineas.length * 5.5 + 9

  linea('Agradezco su apoyo.', { salto: 22 })
  linea('Saludos.', { salto: 22 })
  doc.line(x, y - 6, x + 70, y - 6)
  linea(FIRMANTE.nombre, { negrita: true })
  linea(FIRMANTE.cargo, { negrita: true, salto: 9 })
  if (redacto) {
    doc.setFontSize(9)
    linea(`Redactó: ${redacto}`)
  }

  doc.save(`Autorización carga mínima_${nombre || profesor.documento || 'profesor'}.pdf`)
}
