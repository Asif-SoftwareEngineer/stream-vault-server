import mongoose from 'mongoose'

import * as config from './config'

export async function connectToDatabase() {
  try {
    const connection = await mongoose.connect(config.MongoUri, {
      connectTimeoutMS: 1000,
    })
    console.log('Connection to the database has been established.')
    return connection
  } catch (ex) {
    console.log(`Couldn't connect to the database: ${ex}`)
    throw ex
  }
}
