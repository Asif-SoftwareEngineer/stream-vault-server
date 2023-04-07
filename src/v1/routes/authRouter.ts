import axios from 'axios'
import { Request, Response, Router } from 'express'
import { getClientIp } from 'request-ip'

import * as config from '../../config'
import * as controller from '../../controllers/auth.controller'
import { errorLogger, infoLogger } from '../../loggers'
import { LogEventType } from '../../models/enums'

const router = Router()

// handle the user auth accordingly
router.post('/signin/:token', controller.signin)

// handle the user auth accordingly
router.post('/signout/:userId', controller.signout)

router.post('/appVisitor', async (req: Request, res: Response) => {
  try {
    const clientIp: string = getClientIp(req)!
    const userId: string = `vis-${clientIp}`
    const eventType: LogEventType = LogEventType.AppLanded

    await axios.post(`${config.server_url}/v2/log/userAction`, {
      userId: userId,
      eventType: eventType,
      clientIp,
    })

    infoLogger.info(`Log [ AppVisitor-${userId} ]: visited our application.`)

    return res.status(200).json({
      status: 200,
      userId: userId,
      message: 'Application visitor has been logged.',
    })
  } catch (err: any) {
    errorLogger.error(`Log [ AppVisitor ]: ${err.message}`)
    return res.status(400).json({ error: err.message })
  }
})

export default router
