import axios from 'axios'
import { Request, Response, Router } from 'express'

import { errorLogger } from '../../loggers'
import { logUserModel, logVideoModel } from '../../models/log'

const router = Router()

router.post('/userAction', async (req: Request, res: Response) => {
  const { userId, eventType, clientIp } = req.body

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
    errorLogger.error('[Log User]: Failed to capture details for the IP')
  }

  // Create a new log user object with the data from the request body
  const newLogUser = new logUserModel({
    userId,
    ip,
    country,
    city,
    eventType,
    timestamp,
  })

  try {
    await newLogUser.save()

    res.status(200).send('Log user added successfully')
  } catch (error) {
    console.error(error)
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

export default router
