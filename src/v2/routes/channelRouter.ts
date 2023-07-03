import { randomBytes } from 'crypto'

import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'

import { checkForDuplicateChannels } from '../../controllers/channel.controller'
import { newChannelApiValidator } from '../../controllers/data-validator.controller'
import { isUserExisting } from '../../controllers/userRegistration.controller'
import { Channel } from '../../models/channel'
import { UserFindingrRequest } from '../../models/customRequest'
import { User, userModel } from '../../models/user'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const pipeline = [
    { $project: { channels: 1, _id: 0 } },
    { $unwind: '$channels' },
    { $replaceRoot: { newRoot: '$channels' } },
  ]
  const channelsList = await userModel.aggregate(pipeline).exec()
  if (channelsList === undefined) {
    res.status(404).send({
      status: 404,
      message: 'No channels found!',
    })
  } else {
    res.status(200).send({
      status: 200,
      channelsList,
    })
  }
})

router.get('/:userId', (req: Request, res: Response) => {
  userModel.findOne(
    {
      userId: req.params.userId,
    },
    function (err: Error, user: User) {
      if (user === null || typeof user === 'undefined') {
        res.status(404).send({
          status: 404,
          message: 'No user found with the specified userId.',
        })
      } else {
        const channels = user?.channels
        if (channels === undefined) {
          res.status(404).send({
            status: 404,
            message: 'No channels found for the specified userId.',
          })
        } else {
          res.status(200).send({
            status: 200,
            channels,
          })
        }
      }
    }
  )
})

// Get the specific channel information (channel ID and userId)
router.get(
  '/:userId/:channelId',
  isUserExisting,
  (req: UserFindingrRequest, res: Response) => {
    const channelId = new Types.ObjectId(req.params.channelId)

    // Access the user object from the request
    const user = req.user!

    // Check if the user has channels
    if (!user.channels) {
      return res.status(404).send({
        status: 404,
        errorMessage: 'No channels found for the specified userId.',
      })
    }

    const channel = user.channels.find((c) => c.channelId === channelId)

    if (!channel) {
      return res.status(404).send({
        status: 404,
        errorMessage: 'No channel found with the specified channelId.',
      })
    }
    return res.status(200).send({
      status: 200,
      channel,
    })
  }
)

router.get('/check/:channelName', (req: Request, res: Response) => {
  userModel.aggregate(
    [
      { $unwind: '$channels' },
      { $group: { _id: '$channels.name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } },
    ],
    function (err, result) {
      if (err) {
        res.status(400).send({
          message: `Error happened while checking duplicate record for channel name`,
        })
      } else if (result) {
        let isChannelNameExists = result.find(({ _id }) => _id === req.params.channelName)

        if (isChannelNameExists) {
          res.status(409).send({
            status: 409,
            message: `Duplicate record found! Channel Name:[${isChannelNameExists._id}] already exists!`,
          })
        } else {
          res.status(200).json('no duplicate found')
        }
      }
    }
  )
})

router.post(
  '/add/:userId',
  newChannelApiValidator,
  isUserExisting,
  checkForDuplicateChannels,
  async (req: Request, res: Response) => {
    const channelObj = req.body as Channel
    channelObj.channelId = new Types.ObjectId(randomBytes(12).toString('hex'))
    channelObj.userId = new Types.ObjectId(req.params.userId)
    channelObj.videos = []
    channelObj.followers = []

    // const updatedUser = await userModel.findOneAndUpdate(
    //   { userId: channelObj.userId },
    //   {
    //     $addToSet: { channels: { $each: [channelObj] } },
    //   },
    //   { returnDocument: 'after' }
    // )
    const updatedUser = true

    if (!updatedUser) {
      res.status(404).send({
        status: 404,
        message: 'Channel Addition failed!',
      })
    } else {
      res.status(200).send({
        status: 200,
        message: 'Channel has been created successfully.',
        channelAdded: channelObj,
      })
    }
  }
)

export default router
