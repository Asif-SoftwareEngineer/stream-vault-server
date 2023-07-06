import { NextFunction, Request, Response } from 'express'
import { User, userModel } from '../models/user'
import { Types } from 'mongoose'

export const isUserAndChannelExisting = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  userModel.findOne(
    {
      _id: new Types.ObjectId(req.params.userId),
      'channels.channelId': new Types.ObjectId(req.params.channelId),
    },
    (err: Error, user: User) => {
      if (!user) {
        res.status(404).send({
          errorMessage: 'Invalid User or Channel specified.',
        })
      } else {
        next()
      }
    }
  )
}
