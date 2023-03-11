import axios from 'axios'

import * as config from './config'

const platformAPIClient = axios.create({
  baseURL: config.platform_api_url,
  timeout: 20000,
  headers: { Authorization: `Key ${config.pi_api_key}` },
})

export default platformAPIClient
