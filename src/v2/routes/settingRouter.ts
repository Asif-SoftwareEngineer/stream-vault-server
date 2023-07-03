import { Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'

import { Setting } from '../../models/setting'
import { userModel } from '../../models/user'

const router = Router()

router.get('/:userId', async (req: Request, res: Response) => {
  const userObj = await userModel.findOne({
    userId: new ObjectId(req.params.userId),
  })
  if (!userObj) {
    res.status(404).send({ message: 'Setting for the User was not found.' })
  } else {
    const settingObj = userObj.settings
    res.send({ status: 200, userSetting: settingObj })
  }
})

router.put('/:userId', async (req: Request, res: Response) => {
  const settingObj = req.body as Setting

  const updatedUser = await userModel.findOneAndUpdate(
    { _id: new ObjectId(req.params.userId) },
    {
      $set: { settings: settingObj },
    },
    {
      returnDocument: 'after',
    }
  )

  if (!updatedUser) {
    res.status(404).send({ message: 'Settings update failed.' })
  } else {
    res.send({ status: 200, UpdatedSetting: updatedUser.settings })
  }
})

export default router
