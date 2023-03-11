import { randomBytes } from 'crypto'

import { NextFunction, Request, Response, Router } from 'express'
import { ObjectId } from 'mongodb'

import { IChannel } from '../../models/channel'
import { IUser, userModel } from '../../models/user'

const router = Router()

// Define a middleware function for validation
const validateData = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body
  if (
    !req.params.userId ||
    !data.name ||
    !data.description ||
    !data.category ||
    !data.tags ||
    !data.handle
  ) {
    res.status(400).json({
      message: 'Channel creation request failed due to insufficient information.',
    })
  } else {
    next()
  }
}

const isUserExisting = (req: Request, res: Response, next: NextFunction) => {
  userModel.findById(new ObjectId(req.params.userId), function (err: Error, user: IUser) {
    if (user === null || typeof user === 'undefined') {
      res.status(404).send({
        message: 'Channel creation request failed due to invalid UserId.',
      })
    } else {
      next()
    }
  })
}

const checkForDuplicateChannels = (req: Request, res: Response, next: NextFunction) => {
  userModel.aggregate(
    [
      { $unwind: '$channels' },
      { $group: { _id: '$channels.name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ],
    function (err, result) {
      if (err) {
        res.status(400).send({
          message: `Error happened while checking duplicate record for channel name`,
        })
      } else if (result) {
        let isChannelNameExists = result.find(({ _id }) => _id === req.body.name)

        if (isChannelNameExists) {
          res.status(409).send({
            message: `Duplicate record found! Channel Name:[${isChannelNameExists._id}] already exists!`,
          })
        } else {
          next()
        }
      } else {
        next()
      }
    }
  )
}

router.get('/:userId', (req: Request, res: Response) => {
  userModel.findOne(
    {
      userId: new ObjectId(req.params.userId),
    },
    function (err: Error, user: IUser) {
      if (user === null || typeof user === 'undefined') {
        res.status(404).send({
          message: 'No user found with the specified userId.',
        })
      } else {
        const channels = user?.channels
        if (channels === undefined) {
          res.status(404).send({
            message: 'No channels found for the specified userId.',
          })
        } else {
          res.status(200).send({ channels })
        }
      }
    }
  )
})

router.post(
  '/add/:userId',
  validateData,
  isUserExisting,
  checkForDuplicateChannels,
  async (req: Request, res: Response) => {
    const channelObj = req.body as IChannel
    channelObj.channelId = randomBytes(12).toString('hex')
    channelObj.userId = req.params.userId

    const updatedUser = await userModel.findOneAndUpdate(
      { _id: channelObj.userId },
      {
        $addToSet: { channels: { $each: [channelObj] } },
      },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      res.status(404).send({ message: 'Channel Addition failed!' })
    } else {
      res.status(200).send({ channelAdded: channelObj })
    }
  }
)

export default router
