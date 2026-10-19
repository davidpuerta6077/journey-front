import test from 'node:test'
import assert from 'node:assert'
import { crearGuardador } from './guardador.js'

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

function guardarControlado() {
  const llamadas = []
  const guardar = (bloques) => new Promise((resolve, reject) => llamadas.push({ bloques, resolve, reject }))
  return { llamadas, guardar }
}

test('agrupa cambios seguidos y guarda solo el último', async () => {
  const { llamadas, guardar } = guardarControlado()
  const g = crearGuardador({ guardar, espera: 20 })
  g.inicial([])
  g.cambio([1]); g.cambio([1, 2]); g.cambio([1, 2, 3])
  await dormir(40)
  assert.strictEqual(llamadas.length, 1)
  assert.deepStrictEqual(llamadas[0].bloques, [1, 2, 3])
  llamadas[0].resolve()
})

test('no guarda si el estado es igual al inicial o al último guardado', async () => {
  const { llamadas, guardar } = guardarControlado()
  const g = crearGuardador({ guardar, espera: 10 })
  g.inicial([1])
  g.cambio([1])
  await dormir(30)
  assert.strictEqual(llamadas.length, 0)
  assert.strictEqual(g.hayPendiente(), false)
})

test('cambios durante una petición en vuelo: una sola petición a la vez y al final se guarda el último', async () => {
  const { llamadas, guardar } = guardarControlado()
  let ok = 0
  const g = crearGuardador({ guardar, espera: 10, onGuardado: () => ok++ })
  g.inicial([])
  g.cambio(['a'])
  await dormir(25)
  assert.strictEqual(llamadas.length, 1)
  g.cambio(['a', 'b'])
  await dormir(25)
  assert.strictEqual(llamadas.length, 1, 'no lanza otra petición mientras la primera sigue en vuelo')
  llamadas[0].resolve()
  await dormir(25)
  assert.strictEqual(llamadas.length, 2)
  assert.deepStrictEqual(llamadas[1].bloques, ['a', 'b'])
  llamadas[1].resolve()
  await dormir(5)
  assert.strictEqual(ok, 2)
  assert.strictEqual(g.hayPendiente(), false)
})

test('error persistente: avisa, no reintenta en bucle y el siguiente cambio vuelve a intentar', async () => {
  const { llamadas, guardar } = guardarControlado()
  const errores = []
  const g = crearGuardador({ guardar, espera: 10, onError: (e) => errores.push(e.message) })
  g.inicial([])
  g.cambio(['x'])
  await dormir(25)
  llamadas[0].reject(new Error('caída'))
  await dormir(50)
  assert.deepStrictEqual(errores, ['caída'])
  assert.strictEqual(llamadas.length, 1, 'no reintenta solo')
  assert.strictEqual(g.hayPendiente(), true)
  g.cambio(['x', 'y'])
  await dormir(25)
  assert.strictEqual(llamadas.length, 2)
  assert.deepStrictEqual(llamadas[1].bloques, ['x', 'y'])
  llamadas[1].resolve()
})

test('tras un error, volver al estado ya guardado avisa "guardado" sin llamar a la API', async () => {
  const { llamadas, guardar } = guardarControlado()
  let ok = 0
  const g = crearGuardador({ guardar, espera: 10, onGuardado: () => ok++ })
  g.inicial(['a'])
  g.cambio([])
  await dormir(25)
  llamadas[0].reject(new Error('caída'))
  await dormir(10)
  g.cambio(['a'])
  await dormir(25)
  assert.strictEqual(llamadas.length, 1)
  assert.strictEqual(ok, 1)
  assert.strictEqual(g.hayPendiente(), false)
})

test('vaciar guarda de inmediato lo pendiente sin esperar el debounce', async () => {
  const { llamadas, guardar } = guardarControlado()
  const g = crearGuardador({ guardar, espera: 10_000 })
  g.inicial([])
  g.cambio(['z'])
  const fin = g.vaciar()
  assert.strictEqual(llamadas.length, 1)
  llamadas[0].resolve()
  await fin
  assert.strictEqual(g.hayPendiente(), false)
})
