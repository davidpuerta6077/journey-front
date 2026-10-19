import Swal from 'sweetalert2'
import '../styles/global/Alerts.css'

// Alertas centralizadas (SweetAlert2), en español, con el mismo lenguaje
// visual que el resto de la app (botones con las mismas formas/colores que
// .btn-primary/.btn-secondary, ver src/styles/global/Alerts.css) en vez de
// los de Bootstrap.
const conEstiloApp = Swal.mixin({
  customClass: { confirmButton: 'swal-btn-primary', cancelButton: 'swal-btn-secondary', denyButton: 'swal-btn-secondary' },
  buttonsStyling: false,
})

// Confirmación de eliminar: ícono de error (no warning, para distinguirla de
// una confirmación cualquiera) y los botones en el orden/color de "esto
// borra algo" - Cancelar en rojo, la acción destructiva en verde.
const conEstiloEliminar = Swal.mixin({
  customClass: { confirmButton: 'swal-btn-success', cancelButton: 'swal-btn-danger' },
  buttonsStyling: false,
})

// Confirmación genérica ("¿Seguro?"): reemplaza los confirm() nativos.
// Devuelve true/false. Úsala antes de eliminar, descartar, aplicar un
// cambio de correo, etc.
export async function confirmAccion({
  title = '¿Estás seguro?',
  text = '',
  icon = 'warning',
  confirmButtonText = 'Sí, continuar',
  cancelButtonText = 'Cancelar',
} = {}) {
  const result = await conEstiloApp.fire({
    title, text, icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  })
  return result.isConfirmed
}

// Pide un texto corto (ej. el nombre de una página). Devuelve el texto sin
// espacios sobrantes, o null si se cancela.
export async function pedirTexto({
  title,
  inputValue = '',
  confirmButtonText = 'Guardar',
  maxLength = 150,
} = {}) {
  const result = await conEstiloApp.fire({
    title,
    input: 'text',
    inputValue,
    inputAttributes: { maxlength: String(maxLength), 'aria-label': title },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    inputValidator: (v) => (!v || !v.trim() ? 'Escribe un nombre' : undefined),
  })
  return result.isConfirmed ? result.value.trim() : null
}

// Confirmación de eliminar/quitar algo: ícono de error, Cancelar en rojo y
// la acción en verde. Devuelve true/false.
export async function confirmEliminar({
  title = '¿Estás seguro?',
  text = '',
  confirmButtonText = 'Sí, eliminar',
  cancelButtonText = 'Cancelar',
} = {}) {
  const result = await conEstiloEliminar.fire({
    title, text,
    icon: 'error',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  })
  return result.isConfirmed
}

// Diálogo de guardar con 3 salidas (Guardar / No guardar / Cancelar), para
// modales que se cierran con cambios sin guardar. Devuelve 'save', 'discard'
// o 'cancel'.
export async function confirmGuardarCambios({
  title = '¿Quieres guardar los cambios?',
  text = '',
} = {}) {
  const result = await conEstiloApp.fire({
    title, text,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    denyButtonText: 'No guardar',
    cancelButtonText: 'Cancelar',
  })
  if (result.isConfirmed) return 'save'
  if (result.isDenied) return 'discard'
  return 'cancel'
}

// Alerta de error bloqueante: reemplaza los alert() de error.
export function alertError(text, footer) {
  return Swal.fire({ icon: 'error', title: 'Oops...', text, ...(footer ? { footer } : {}) })
}

// Alerta de éxito bloqueante (algo se creó/guardó y vale la pena confirmarlo
// con el usuario antes de seguir).
export function alertExito(title = '¡Listo!', text = '') {
  return Swal.fire({ icon: 'success', title, text, draggable: true })
}

// Toast de éxito no bloqueante (acciones rápidas que no necesitan
// confirmación, ej. autoguardado).
export function toastExito(title = 'Hecho') {
  return Swal.fire({
    position: 'top-end',
    icon: 'success',
    title,
    showConfirmButton: false,
    timer: 1500,
  })
}
