import { randomBytes } from 'crypto'

import { NextFunction, Request, Response, Router } from 'express'
import { getClientIp } from 'request-ip'

import * as uploadController from './../../controllers/fileUpload-controller'
import { IUser, userModel } from '../../models/user'
import { IVideo } from '../../models/video'

//import { AuthenticatingRequest } from '../../models/customRequests'

const router = Router()

interface CustomRequest extends Request {
  checkIfUserExistsWithThisReaction?: any
}

const validateDataForGetAllVidzRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.userId) {
    res.status(400).json({
      message: 'UserId is missing.',
    })
  } else {
    const ip = getClientIp(req)! // extractTheIP(req)
    req.params.userId = req.params.userId === 'visitor' ? `vis-${ip}` : req.params.userId
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

const validateVideoReactRequest = (req: Request, res: Response, next: NextFunction) => {
  const { userId, channelId, videoId, reActingUserId, reactionType } = req.params
  if (!userId || !channelId || !videoId || !reActingUserId || !reactionType) {
    res.status(400).send({ message: 'Invalid/missing request parameters specified!' })
  } else {
    const ip = getClientIp(req)! //extractTheIP(req)
    req.params.userId = req.params.userId === 'visitor' ? `vis-${ip}` : req.params.userId
    next()
  }
}

// function extractTheIP(req: Request): string {
//   const ip = req.clientIp!
//   return ip
// }

const reactionAlreayExists = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, videoId, reActingUserId, reactionType } = req.params

    const pipeline = [
      {
        $match: {
          userId: userId,
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
      {
        $unwind: '$channels.videos.reactions',
      },
      {
        $match: {
          'channels.channelId': channelId,
          'channels.videos.videoId': videoId,
          'channels.videos.reactions': { $exists: true, $ne: [] },
        },
      },
      {
        $match: {
          'channels.videos.reactions.reactingUserId': reActingUserId,
          'channels.videos.reactions.reactionType': reactionType,
        },
      },
      {
        $project: {
          _id: 0,
          title: '$channels.videos.title',
        },
      },
    ]

    const vidWithReaction = await userModel.aggregate(pipeline).exec()

    req.checkIfUserExistsWithThisReaction = vidWithReaction.length > 0 ? true : false
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'An error occurred while processing request.' })
  }
}

const toggleLikeDislikeReaction = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, channelId, videoId, reActingUserId, reactionType } = req.params

    const deletableOppositeReaction = reactionType === 'like' ? 'dislike' : 'like'

    if (reactionType === 'like' || reactionType === 'dislike') {
      // Like/dislike reaction does not exist

      //the reaction exists so we need to delete it
      const reactionToRemove = {
        reactionType: deletableOppositeReaction,
        reactingUserId: reActingUserId,
      }

      await userModel.findOneAndUpdate(
        {
          userId: userId,
          'channels.channelId': channelId,
          'channels.videos.videoId': videoId,
        },
        {
          $pull: {
            'channels.$[channel].videos.$[video].reactions': reactionToRemove,
          },
        },
        {
          arrayFilters: [
            { 'channel.channelId': channelId },
            { 'video.videoId': videoId },
          ],
          new: true,
        }
      )
    }

    next()
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'An error occurred while processing request.' })
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

const getTotalReactionsWithLikesAndDislikes = async (
  channelId: string,
  videoId: string,
  objLikesDislikes: any
) => {
  const pipeline = [
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
    {
      $match: {
        'channels.channelId': channelId,
        'channels.videos.videoId': videoId,
        'channels.videos.reactions': { $exists: true, $ne: [] },
      },
    },
    {
      $project: {
        _id: 0,
        title: '$channels.videos.title',
        likes: {
          $size: {
            $filter: {
              input: '$channels.videos.reactions',
              cond: { $eq: ['$$this.reactionType', 'like'] },
            },
          },
        },
        disLikes: {
          $size: {
            $filter: {
              input: '$channels.videos.reactions',
              cond: { $eq: ['$$this.reactionType', 'dislike'] },
            },
          },
        },
      },
    },
  ]

  const videoWithAggregateReactions = await userModel.aggregate(pipeline).exec()

  if (!videoWithAggregateReactions) {
  } else {
    if (videoWithAggregateReactions.length) {
      objLikesDislikes.Likes = videoWithAggregateReactions[0].likes
      objLikesDislikes.Dislikes = videoWithAggregateReactions[0].disLikes
    }
  }
}

router.get(
  '/:userId',
  validateDataForGetAllVidzRequest,
  async (req: Request, res: Response) => {
    const serverUrl: string = `${req.protocol}://${req.get('host')}`
    const watchingUserId: string = req.params.userId

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
          disLikes: {
            $size: {
              $filter: {
                input: '$channels.videos.reactions',
                cond: { $eq: ['$$this.reactionType', 'dislike'] },
              },
            },
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

router.post(
  '/submitReaction/:userId/:channelId/:videoId/:reActingUserId/:reactionType',
  validateVideoReactRequest,
  reactionAlreayExists,
  toggleLikeDislikeReaction,
  async (req: CustomRequest, res: Response) => {
    try {
      let obj = {
        Likes: Number,
        Dislikes: Number,
      }

      if (!req.checkIfUserExistsWithThisReaction) {
        //there is no specific reaction, so we need to add one

        const reaction = {
          reactionType: req.params.reactionType,
          reactingUserId: req.params.reActingUserId,
        }

        const updatedUser = await userModel.findOneAndUpdate(
          {
            userId: req.params.userId,
            'channels.channelId': req.params.channelId,
            'channels.videos.videoId': req.params.videoId,
          },
          {
            $addToSet: {
              'channels.$[channel].videos.$[video].reactions': reaction,
            },
          },
          {
            arrayFilters: [
              {
                'channel.channelId': req.params.channelId,
              },
              { 'video.videoId': req.params.videoId },
            ],
            upsert: true,
            new: true,
          }
        )

        if (!updatedUser) {
          res.status(500).send({ message: 'Reaction to the video failed!' })
        } else {
          await getTotalReactionsWithLikesAndDislikes(
            req.params.channelId,
            req.params.videoId,
            obj
          )
        }

        res.status(200).send({
          status: 200,
          reactionType: reaction.reactionType,
          message: 'Reaction added to the video.',
          likes: obj.Likes,
          dislikes: obj.Dislikes,
        })
      } else {
        res.status(409).send({
          message: `Reaction already exists from the user: ${req.params.reActingUserId}.`,
        })
      }
    } catch (error) {
      // handle any errors that may occur during the database update operation
      console.error(error)
      res.status(500).send({ message: 'An error occurred while updating the database.' })
    }
  }
)

router.post(
  '/withdrawReaction/:userId/:channelId/:videoId/:reActingUserId/:reactionType',
  validateVideoReactRequest,
  reactionAlreayExists,
  async (req: CustomRequest, res: Response) => {
    try {
      let obj = {
        Likes: Number,
        Dislikes: Number,
      }

      if (req.checkIfUserExistsWithThisReaction) {
        const reactionToRemove = {
          reactionType: req.params.reactionType,
          reactingUserId: req.params.reActingUserId,
        }

        const updatedUser = await userModel.findOneAndUpdate(
          {
            userId: req.params.userId,
            'channels.channelId': req.params.channelId,
            'channels.videos.videoId': req.params.videoId,
          },
          {
            $pull: {
              'channels.$[channel].videos.$[video].reactions': reactionToRemove,
            },
          },
          {
            arrayFilters: [
              { 'channel.channelId': req.params.channelId },
              { 'video.videoId': req.params.videoId },
            ],
            new: true,
          }
        )

        if (!updatedUser) {
          res.status(500).send({ message: 'Reaction to the video failed!' })
        } else {
          await getTotalReactionsWithLikesAndDislikes(
            req.params.channelId,
            req.params.videoId,
            obj
          )
        }

        res.status(200).send({
          status: 200,
          message: 'Reaction withdrawn from the video.',
          likes: obj.Likes,
          dislikes: obj.Dislikes,
        })
      } else {
        res.status(200).send({
          message: `Reaction does not exist from the user: ${req.params.reActingUserId}.`,
        })
      }
    } catch (error) {
      // handle any errors that may occur during the database update operation
      console.error(error)
      res.status(500).send({ message: 'An error occurred while updating the database.' })
    }
  }
)

router.post('/upload/:userId/:channelId', uploadController.upload)

export default router
