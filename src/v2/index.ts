import { Router } from 'express'

import channelRouter from './routes/channelRouter'
import locationRouter from './routes/locationRouter'
import logRouter from './routes/logRouter'
import mediaRouter from './routes/mediaRouter'
import paymentRouter from './routes/paymentsRouter'
import reactionsRouter from './routes/reactionsRouter'
import searchRouter from './routes/searchRouter'
import settingRouter from './routes/settingRouter'
import streamRouter from './routes/streamRouter'
import userRouter from './routes/userRouter'
import videoRouter from './routes/videoRouter'

const router = Router()

// Configure all v2 routers here
router.use('/channels?', channelRouter)
router.use('/videos?', videoRouter)
router.use('/search', searchRouter)
router.use('/setting', settingRouter)
router.use('/users?', userRouter)
router.use('/payments', paymentRouter)
router.use('/stream', streamRouter)
router.use('/log', logRouter)
router.use('/reactions', reactionsRouter)
router.use('/location', locationRouter)
router.use('/media', mediaRouter)

export default router
