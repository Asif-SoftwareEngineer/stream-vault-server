import { Router } from 'express'

import channelRouter from './routes/channelRouter'
import searchRouter from './routes/searchRouter'
import settingRouter from './routes/settingRouter'
import userRouter from './routes/userRouter'
import videoRouter from './routes/videoRouter'

const router = Router()

// Configure all v2 routers here
router.use('/channels?', channelRouter)
router.use('/video', videoRouter)
router.use('/search', searchRouter)
router.use('/setting', settingRouter)
router.use('/users?', userRouter)

export default router
