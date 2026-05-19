import axios from 'axios'

export const fetchEnrollments = async () => {
  const res = await axios.get('/enrollments/preview')
  const items = res.data?.body || []
  return items.map(e => ({
    ...e,
    nombre: `${e.firstname || ''} ${e.lastname || ''}`.trim()
  }))
}

export const syncEnrollments = async (items) => {
  const res = await axios.post('/sync/enrollments', { items })
  return res.data
}