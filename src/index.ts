import * as http from 'http'

import { connect } from 'mongoose'

import app from './app'
import * as config from './config'
import { errorLogger, infoLogger } from './loggers'

export let Instance: http.Server

async function start() {
  console.log('Starting server: ')
  console.log(`isProd: ${config.IsProd}`)
  console.log(`port: ${config.Port}`)
  console.log(`mongoUri: ${config.MongoUri}`)

  try {
    await connect(config.MongoUri, {
      connectTimeoutMS: 1000,
    }).then(
      () => {
        infoLogger.info('Connection to the MongoDb has been established')
      },
      (err) => {
        errorLogger.error(err)
      }
    )
  } catch (ex) {
    errorLogger.error(`Couldn't connect to a database: ${ex}`)
  }

  Instance = http.createServer(app)

  Instance.listen(config.Port, async () => {
    infoLogger.info(`Server listening on port ${config.Port}...`)

    infoLogger.info('Server Start: Done.')
  })
}
start()
