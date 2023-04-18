import axios from 'axios'
import { Request, Response, Router } from 'express'

import { errorLogger, infoLogger } from '../../loggers'
import { LogEventType } from '../../models/enums'
import { logUserModel, logVideoModel } from '../../models/log'

const router = Router()

router.post('/userAction', async (req: Request, res: Response) => {
  const { userId, eventType, clientIp, details } = req.body

  let country: string = 'NA'
  let city: string = 'NA'
  const timestamp = new Date().toISOString()
  const ip: string = clientIp
  const logDetails: string = details || ''

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
      const existingLoggedUser = await findUserLog(userId, eventType)

      if (existingLoggedUser) {
        infoLogger.info('[Log User]: Already logged user found.')
        res.status(200).send('Already logged user found.')
      }
    } catch (err) {
      res.status(500).send('Error happened while finding the existing logged user')
    }
  }

  // Create a new log user object with the data from the request body
  const newLogUser = new logUserModel({
    userId,
    ip,
    country,
    city,
    eventType,
    timestamp,
    logDetails,
  })

  try {
    await newLogUser.save()

    res.status(200).send('Log user added successfully')
  } catch (error) {
    errorLogger.error('[Log User]: Failed to insert log user')
    res.status(500).send('Failed to insert log user')
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

async function findUserLog(userId: string, eventType: LogEventType) {
  const today = new Date().toISOString().substring(0, 10)
  const logUser = await logUserModel
    .findOne({
      $and: [
        { userId: { $eq: userId } },
        { eventType: { $eq: eventType.toString() } },
        { timestamp: { $regex: `^${today}` } },
      ],
    })
    .exec()
  return logUser
}

export default router
