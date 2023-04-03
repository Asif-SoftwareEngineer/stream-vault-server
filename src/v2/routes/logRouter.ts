import { Request, Response, Router } from 'express'

import { logUserModel, logVideoModel } from '../../models/log'

const router = Router()

// function extractTheIP(req: Request): string {
//   const ip = req.clientIp!
//   return ip
// }

router.post('/userAction', async (req: Request, res: Response) => {
  const { userId, eventType, clientIp } = req.body

  const country: string = 'aus'
  const city: string = 'melb'
  const timestamp = new Date().toISOString()
  const ip: string = clientIp

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

  const country: string = 'aus'
  const city: string = 'melb'
  const timestamp = new Date().toISOString()
  const ip: string = clientIp

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
