import test from 'node:test'
import assert from 'node:assert'
import { crearSesion } from './sesion.js'

// Guardador falso: registra cambios y resuelve vaciar según `falla`.
function guardadorFalso({ falla = false } = {}) {
  const cambios = []
  let pendiente = false
  return {
    cambios,
    cambio: (b) => { cambios.push(b); pendiente = true },
    vaciar: async () => { if (!falla) pendiente = false },
    hayPendiente: () => pendiente,
  }
}

test('codex:ready responde con los últimos bloques recibidos, no con los de la apertura', () => {
  const g = guardadorFalso()
  const s = crearSesion({ bloques: ['inicial'], guardador: g })
  assert.deepStrictEqual(s.mensaje({ tipo: 'codex:ready' }), { tipo: 'codex:load', bloques: ['inicial'] })
  s.mensaje({ tipo: 'codex:change', bloques: ['editado'] })
  assert.deepStrictEqual(s.mensaje({ tipo: 'codex:ready' }), { tipo: 'codex:load', bloques: ['editado'] })
  assert.deepStrictEqual(g.cambios, [['editado']])
})

test('codex:change sin lista de bloques se ignora', () => {
  const g = guardadorFalso()
  const s = crearSesion({ bloques: [], guardador: g })
  assert.strictEqual(s.mensaje({ tipo: 'codex:change', bloques: 'x' }), null)
  assert.strictEqual(s.mensaje({ tipo: 'otro' }), null)
  assert.deepStrictEqual(g.cambios, [])
})

test('salir lee el estado actual del editor (aún no enviado) y lo guarda', async () => {
  const g = guardadorFalso()
  const s = crearSesion({ bloques: [], guardador: g })
  const ok = await s.salir(() => ['sin enviar'])
  assert.deepStrictEqual(g.cambios, [['sin enviar']])
  assert.strictEqual(ok, true)
})

test('salir sin acceso al editor guarda lo que ya tenía', async () => {
  const g = guardadorFalso()
  const s = crearSesion({ bloques: [], guardador: g })
  assert.strictEqual(await s.salir(undefined), true)
  assert.deepStrictEqual(g.cambios, [])
})

test('salir devuelve false si el guardado falló (para avisar al usuario)', async () => {
  const g = guardadorFalso({ falla: true })
  const s = crearSesion({ bloques: [], guardador: g })
  assert.strictEqual(await s.salir(() => ['x']), false)
})
