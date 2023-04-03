import { randomBytes } from 'crypto'

import { NextFunction, Request, Response, Router } from 'express'
import { getClientIp } from 'request-ip'

import * as uploadController from './../../controllers/fileUpload-controller'
import { IUser, userModel } from '../../models/user'
import { IVideo } from '../../models/video'

const router = Router()

const validateDataForGetAllVidzRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.watchingUserId) {
    res.status(400).json({
      message: 'UserId is missing.',
    })
  } else {
    const ip = getClientIp(req)!
    req.params.watchingUserId =
      req.params.watchingUserId === 'visitor' ? `vis-${ip}` : req.params.watchingUserId
    next()
  }
}

const validateVideoAddRequest = (req: Request, res: Response, next: NextFunction) => {
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

router.get(
  '/:watchingUserId',
  validateDataForGetAllVidzRequest,
  async (req: Request, res: Response) => {
    const serverUrl: string = `${req.protocol}://${req.get('host')}`
    const watchingUserId: string = req.params.watchingUserId

    const pipeline = [
      // Match documents that have at least one video
      {
        $match: {
          'channels.videos': { $exists: true },
        },
      },
      // Unwind the channels array to create a separate document for each channel
      {
        $unwind: '$channels',
      },
      // Unwind the videos array to create a separate document for each video
      {
        $unwind: '$channels.videos',
      },
      // Project the fields you want to include in the output
      {
        $project: {
          _id: 0,
          userId: 1,
          channelId: '$channels.channelId',
          videoId: '$channels.videos.videoId',
          userName: '$streamVault_username',
          channelName: '$channels.name',
          title: '$channels.videos.title',
          description: '$channels.videos.description',
          url: {
            $concat: [
              serverUrl,
              '/v2/stream/',
              '$channels.videos.filePath',
              '/',
              watchingUserId,
              '/',
              '$channels.videos.videoId',
            ],
          },
          thumbnail: {
            $concat: [serverUrl, '/thumbnails/vidz/', '$channels.videos.thumbnail'],
          },
          likes: {
            $size: {
              $filter: {
                input: '$channels.videos.reactions',
                cond: { $eq: ['$$this.reactionType', 'like'] },
              },
            },
          },
          dislikes: {
            $size: {
              $filter: {
                input: '$channels.videos.reactions',
                cond: { $eq: ['$$this.reactionType', 'dislike'] },
              },
            },
          },

          yourReaction: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$channels.videos.reactions',
                      cond: { $eq: ['$$this.reactingUserId', watchingUserId] },
                    },
                  },
                  0,
                ],
              },
              { reactionType: null },
            ],
          },
        },
      },
    ]

    const videosList = await userModel.aggregate(pipeline).exec()

    if (videosList === undefined) {
      res.status(404).send({
        status: 404,
        message: 'No videos found for the specified userId.',
      })
    } else {
      res.status(200).send({
        status: 200,
        videosList,
      })
    }
  }
)

router.post(
  '/add/:userId/:channelId',
  validateVideoAddRequest,
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

export default router
