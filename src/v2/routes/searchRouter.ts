import { Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'

import { userModel } from '../../models/user'

const router = Router()

// Search any video or channel that match with the search string
router.get('/:userId', async (req: Request, res: Response) => {
  const userObj = await userModel.findOne({ userId: new ObjectId(req.params.userId) })
  if (!userObj) {
    res.status(404).send({ message: 'User not found.' })
  } else {
    res.send({ status: 200, user: userObj })
  }
})

export default router
