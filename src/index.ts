import * as http from 'http'

import app from './app'
import * as config from './config'
import { connectToDatabase } from './db'

export let Instance: http.Server

async function start() {
  console.log('Starting server: ')
  console.log(`isProd: ${config.IsProd}`)
  console.log(`port: ${config.Port}`)
  console.log(`mongoUri: ${config.MongoUri}`)
  console.log(`-------------------------------`)

  console.log(`Now connecting to MongoDB database.`)

  try {
    connectToDatabase()

    Instance = http.createServer(app)

    Instance.listen(config.Port, async () => {
      console.log(`Server listening on port ${config.Port}...`)

      console.log('Server Start: Done.')
    })
  } catch (error) {
    console.log('Error raised during Node Server start.')
  }
}
start()
