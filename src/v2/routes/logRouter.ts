import { Request, Response, Router } from 'express'

import { logUserModel, logVideoModel } from '../../models/log'

const router = Router()

function extractTheIP(req: Request): string {
  let ip: string = ''

  // capture the IP in case of a site visitor

  if (req.headers['x-forwarded-for']) {
    ip = (req.headers['x-forwarded-for'] as string).split(',')[0]
  } else if (req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress
  } else {
    ip = req.ip
  }

  return ip
}

router.post('/userAction', async (req: Request, res: Response) => {
  const { userId, eventType } = req.body

  const ip: string = extractTheIP(req)
  const country: string = 'aus'
  const city: string = 'melb'
  const timestamp = new Date().toISOString()

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

    console.log('Log user added successfully')
    res.status(200).send('Log user added successfully')
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to insert log user')
  } finally {
  }
})

router.post('/videoAction', async (req: Request, res: Response) => {
  const { userId, eventType, videoId } = req.body

  const ip: string = extractTheIP(req)
  const country: string = 'aus'
  const city: string = 'melb'
  const timestamp = new Date().toISOString()

  console.log('this is the ip:' + ip)

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

    console.log('Video logged successfully')
    res.status(200).send('Video Logged successfully')
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to log video')
  } finally {
  }
})

export default router
