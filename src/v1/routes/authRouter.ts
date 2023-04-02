import { Router } from 'express'

import * as controller from '../../controllers/auth.controller'

const router = Router()

// handle the user auth accordingly
router.post('/signin/:token', controller.signin)

// handle the user auth accordingly
router.post('/signout/:userId', controller.signout)

export default router
