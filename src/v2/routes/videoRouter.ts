import { randomBytes } from 'crypto'

import { NextFunction, Request, Response, Router } from 'express'

import { IChannel } from '../../models/channel'
import { IUser, userModel } from '../../models/user'
import { IVideo } from '../../models/video'

import uploadController = require('./../../controllers/fileUpload-controller')

const router = Router()

// //Define a middleware function for validation
const validateData = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body

  if (
    !req.params.userId ||
    !req.params.channelId ||
    !data.title ||
    !data.description ||
    !data.category ||
    !data.tags
  ) {
    res.status(400).json({
      message: 'Video creation request failed due to insufficient information.',
    })
  } else {
    next()
  }
}

//Check if the user and its channel exist
const isUserandChannelExisting = (req: Request, res: Response, next: NextFunction) => {
  userModel.findOne(
    {
      $and: [
        { userId: req.params.userId },
        { 'channels.channelId': req.params.channelId },
      ],
    },
    (err: Error, user: IUser) => {
      if (!user) {
        res.status(404).send({
          message: 'Fetching list of videos failed due to invalid User or Channel.',
        })
      } else {
        next()
      }
    }
  )
}

router.get('/:userId/:channelId', (req: Request, res: Response) => {
  userModel.findOne(
    {
      userId: req.params.userId,
      'channels.channelId': req.params.channelId,
    },
    function (err: Error, user: IUser) {
      if (user === null || typeof user === 'undefined') {
        res.status(404).send({
          message: 'No user found with the specified userId.',
        })
      } else {
        const channel = user?.channels?.find(
          (c: IChannel) => c.channelId.toString() === req.params.channelId
        )
        if (channel === undefined) {
          res.status(404).send({
            message: 'No channel found with the specified channelId.',
          })
        } else {
          const videos = channel?.videos
          if (videos === undefined) {
            res.status(404).send({
              message: 'No videos found for the specified channel.',
            })
          } else {
            res.status(200).send({ videos })
          }
        }
      }
    }
  )
})

router.get('/', async (req: Request, res: Response) => {
  // const videos = await userModel.aggregate([
  //   { $unwind: '$channels' },
  //   { $unwind: '$channels.videos' },
  //   { $project: { _id: 0, video: '$channels.videos' } },
  // ])

  const videos = await userModel.aggregate([
    { $unwind: '$channels' },
    { $unwind: '$channels.videos' },
    {
      $lookup: {
        from: 'channels',
        localField: 'channels._id',
        foreignField: '_id',
        as: 'channel',
      },
    },
    { $unwind: '$channel' },
    {
      $project: {
        user_name: '$pichain_username',
        channel_name: '$channel.name',
        video: '$channels.videos',
      },
    },
  ])

  if (videos === undefined) {
    res.status(404).send({
      message: 'No videos found!',
    })
  } else {
    res.status(200).send({ videos })
  }
})

router.post(
  '/add/:userId/:channelId',
  validateData,
  isUserandChannelExisting,
  (req: Request, res: Response) => {
    const videoObj = req.body as IVideo
    videoObj.videoId = randomBytes(12).toString('hex')
    videoObj.userId = req.params.userId
    videoObj.channelId = req.params.channelId

    userModel.findOneAndUpdate(
      {
        userId: videoObj.userId,
        'channels.channelId': videoObj.channelId,
      },
      {
        $push: { 'channels.$.videos': videoObj },
      },
      {
        new: true,
      },
      (error, updatedUser) => {
        if (error || !updatedUser) {
          res.status(500).send({ message: 'Video Addition failed!' })
        } else {
          res.status(200).send({
            status: 200,
            message: 'Video data added successfully to the channel',
            videoAdded: videoObj,
            updatedUser: updatedUser,
          })
        }
      }
    )
  }
)

router.post('/upload/:userId/:channelId', uploadController.upload)

// router.put(
//   '/:userId/:channelId',
//   isUserandChannelExisting,
//   async (req: Request, res: Response) => {}
// )

// router.delete(
//   '/deleteVideo/:userId/:channelId',
//   isUserandChannelExisting,
//   async (req: Request, res: Response) => {}
// )

export default router
