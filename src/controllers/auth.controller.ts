import axios from 'axios'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { getClientIp } from 'request-ip'

import * as config from '../config'
import { errorLogger, infoLogger } from '../loggers'
import { LogEventType } from '../models/enums'
import { piUserModel } from '../models/pisignuser'
import platformAPIClient from '../platformApiClient'

export const signin = async (req: Request, res: Response) => {
  const token = req.params.token

  if (!token) {
    return res.status(401).json({ error: 'Invalid access token' })
  }

  try {
    const { data: me } = await platformAPIClient.get('/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    const currentUser = await piUserModel.findOne({ uid: me.uid })

    if (currentUser) {
      const clientIp: string = getClientIp(req)!
      await axios.post(`${config.server_url}/v2/log/userAction`, {
        userId: me.uid,
        eventType: LogEventType.ReAuthenticate,
        clientIp,
      })

      infoLogger.info(`User [ ${me.uid} ] re-authenticated.`)
    }

    await piUserModel.findOneAndUpdate(
      { uid: me.uid },
      {
        $set: {
          accessToken: token,
          valid_timestamp: me.credentials.valid_until.timestamp,
          iso8601: me.credentials.valid_until.iso8601,
          signin_date: new Date().toISOString().substring(0, 10),
        },
      },
      { upsert: true, new: true }
    )

    const appToken = jwt.sign({ id: me.uid }, config.session_secret, {
      expiresIn: 86400,
    })

    return res.status(200).send({
      status: 200,
      appAccessToken: appToken,
      message: 'User signed in',
    })
  } catch (error: any) {
    errorLogger.error(`[Controller: Signin]: ${JSON.stringify(error)}`)
    return res.status(400).json({ error: error.message })
  }
}

export const signout = async (req: Request, res: Response) => {
  try {
    // Make a POST request to the /userAction endpoint with the data from the request body

    const userId: string = req.params.userId
    const currentUser = await piUserModel.findOne({ uid: userId })

    if (currentUser) {
      const eventType: string = LogEventType.SignOut
      const url = config.server_url

      const clientIp: string = getClientIp(req)!
      await axios.post(`${url}/v2/log/userAction`, {
        userId,
        eventType,
        clientIp,
      })

      infoLogger.info(`[User Signout] [ ${userId} ] signed out.`)
    }
  } catch (error) {
    errorLogger.error(`[Controller Signout]-  ${JSON.stringify(error)}`)
  }

  return res.status(200).json({ message: 'User signed out' })
}
