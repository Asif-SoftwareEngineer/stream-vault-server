import axios from 'axios'
import { Request, Response, Router } from 'express'

import { errorLogger, infoLogger } from '../../loggers'
import { LogEventType } from '../../models/enums'
import { LogUser, logUserModel, logVideoModel } from '../../models/log'

const router = Router()

router.post('/userAction', async (req: Request, res: Response) => {
  const { userId, eventType, clientIp, logDetails } = req.body

  const strUserId = userId.toString()

  let country: string = 'NA'
  let city: string = 'NA'
  const timestamp = new Date().toISOString()
  const ip: string = clientIp
  let details: string = logDetails ? logDetails.toString() : ''

  try {
    const url = `https://get.geojs.io/v1/ip/geo/${ip}.json`
    const response = await axios.get(url)
    const geoData = response.data

    if (geoData) {
      country = geoData.country_code || 'NA'
      city = geoData.city || 'NA'
    }
  } catch (error) {
    errorLogger.error('[Log User]: Failed to capture details for the IP')
  }

  //if appLanded logs exists for a visior in today's date, then ignore logging new entry

  if (eventType === LogEventType.AppLanded) {
    try {
      const existingLoggedUser = await findUserLog(userId, eventType, new Date())

      if (existingLoggedUser) {
        infoLogger.info(`[Log User]: Already logged [ ${userId} ] user found.`)
        return res.status(200).send(`Already logged [ ${userId} ] user found.`)
      }
    } catch (err) {
      return res.status(500).send('Error happened while finding the existing logged user')
    }
  }

  if (eventType === LogEventType.ReAuthenticate && !strUserId.startsWith('AppVisitor')) {
    try {
      const existingLoggedUser = await findUserLog(userId, eventType)

      if (existingLoggedUser) {
        let totalReAuthAttempts: number
        totalReAuthAttempts = Number(existingLoggedUser.details || 0)

        // increment the re authentication by 1
        totalReAuthAttempts += 1
        details = totalReAuthAttempts.toString()

        const logUserUpdated = await logUserModel.findOneAndUpdate(
          {
            eventType: eventType,
            userId: strUserId,
          },
          {
            $set: {
              ip: ip,
              timestamp: timestamp,
              city: city,
              country: country,
              details: details,
            },
          },
          { upsert: true, new: true }
        )

        if (logUserUpdated) {
          infoLogger.info(
            `[Log User]: User [ ${userId} ] Log updated with re-authenticating details.`
          )
          return res
            .status(200)
            .send(`User [ ${userId} ] Log updated with re-authenticating details.`)
        }
      }
    } catch (err) {
      return res.status(500).send('Error happened while finding the existing logged user')
    }
  }

  //In all other cases, Create a new log user object with the data from the request body
  const newLogUser = new logUserModel({
    userId,
    ip,
    country,
    city,
    eventType,
    timestamp,
    details,
  })

  try {
    await newLogUser.save()
    infoLogger.info(`[Log User]:  User [ ${userId} ] added to log successfully`)
    return res.status(200).send(`User [ ${userId} ] added to log successfully`)
  } catch (error) {
    errorLogger.error('[Log User]: Failed to insert log user')
    return res.status(500).send('Failed to insert log user')
  } finally {
  }
})

router.post('/videoAction', async (req: Request, res: Response) => {
  const { userId, eventType, videoId, clientIp } = req.body

  let country: string = 'NA'
  let city: string = 'NA'
  const timestamp = new Date().toISOString()
  const ip: string = clientIp

  try {
    const url = `https://get.geojs.io/v1/ip/geo/${ip}.json`
    const response = await axios.get(url)
    const geoData = response.data

    if (geoData) {
      country = geoData.country_code || 'NA'
      city = geoData.city || 'NA'
    }
  } catch (error) {
    errorLogger.error('[Log Video]: Failed to capture details for the IP')
  }

  // Create a new log user object with the data from the request body
  const newLogVideo = new logVideoModel({
    userId,
    ip,
    country,
    city,
    eventType,
    timestamp,
    videoId,
  })

  try {
    await newLogVideo.save()

    res.status(200).send('Video Logged successfully')
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to log video')
  } finally {
  }
})

async function findUserLog(
  userId: string,
  eventType: LogEventType,
  date?: Date
): Promise<LogUser | null> {
  let logUser

  if (!date) {
    logUser = await logUserModel
      .findOne({
        $and: [{ userId: { $eq: userId } }, { eventType: { $eq: eventType.toString() } }],
      })
      .exec()
  } else {
    const today = date.toISOString().substring(0, 10)
    logUser = await logUserModel
      .findOne({
        $and: [
          { userId: { $eq: userId } },
          { eventType: { $eq: eventType.toString() } },
          { timestamp: { $regex: `^${today}` } },
        ],
      })
      .exec()
  }

  return logUser
}

export default router
