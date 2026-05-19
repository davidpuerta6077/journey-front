import axios from 'axios'

export const fetchUsers = async () => {
  const res = await axios.get('/sync/preview/students')
  const items = res.data?.body || []
  return items.map(u => ({
    ...u,
    nombre: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
    departamento: u.departamento_academico || '-',
    _syncStatus: u._syncStatus || { inDB: false, inMoodle: false }
  }))
}

export const syncUsers = async (items) => {
  const res = await axios.post('/sync/students', { items })
  return res.data
}

export const deleteUser = async (id) => {
  await axios.delete(`/journey/usuarios/${id}`)
}

export const updateUser = async (id, form) => {
  await axios.put(`/journey/usuarios/${id}`, form)
}