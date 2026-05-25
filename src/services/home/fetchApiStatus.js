import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base


export const fetchApiStatus = async () => {
  try {
    const res = await axios.get(`${BASE}/users/test`)

    return res.data.body.test_message

  } catch (error) {
    console.error(error)
    return 'Error'
  }
}