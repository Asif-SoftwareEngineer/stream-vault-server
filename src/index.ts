import * as http from 'http'

import { connect } from 'mongoose'

import app from './app'
import * as config from './config'

//import * as document from 'document-ts'

//import { UserCollection } from './models/user'
//import { initializeDemoUser } from './services/userService'

export let Instance: http.Server

async function start() {
  console.log('Starting server: ')
  console.log(`isProd: ${config.IsProd}`)
  console.log(`port: ${config.Port}`)
  console.log(`mongoUri: ${config.MongoUri}`)
  console.log(`JWT-Secret: ${config.JwtSecret()}`)

  // if (!config.JwtSecret() || config.JwtSecret() === 'xxxxxx') {
  //   throw new Error(
  //     'JWT_SECRET env var not set or set to default value. Pick a secure password.'
  //   )
  // }

  try {
    await connect(config.MongoUri, {
      connectTimeoutMS: 1000,
    }).then(
      () => {
        console.log('Connection to the MongoDb has been established')
      },
      (err) => {
        console.log('Express Server failed to connect to MongoDB')
      }
    )
  } catch (ex) {
    console.log(`Couldn't connect to a database: ${ex}`)
  }

  Instance = http.createServer(app)

  Instance.listen(config.Port, async () => {
    console.log(`Server listening on port ${config.Port}...`)
    console.log('Initializing default user...')

    console.log('Server Start: Done.')
  })
}
start()
